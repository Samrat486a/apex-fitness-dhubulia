#!/usr/bin/env python3
"""
End-to-end API test for the Apex Fitness PHP backend (real PHP + real MySQL).

    APEX_CONFIG=/path/to/test-config.php php -S localhost:8090 -t backend/public &
    APEX_CONFIG=/path/to/test-config.php python3 backend/tests/api_test.py http://localhost:8090

Use a SEPARATE, freshly imported test database — this script creates users and memberships.
APEX_CONFIG is needed so the admin-promotion step (create-admin.php) hits the same database.
"""
import datetime as dt
import http.cookiejar
import json
import os
import random
import subprocess
import sys
import urllib.error
import urllib.request

BASE = sys.argv[1].rstrip('/') if len(sys.argv) > 1 else 'http://localhost:8090'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RUN = random.randint(10000, 99999)
passed = failed = 0


class Client:
    def __init__(self):
        self.jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))
        self.csrf = None

    def call(self, method, path, body=None, csrf=True, query=''):
        headers = {'Accept': 'application/json'}
        data = None
        if method == 'POST':
            headers['Content-Type'] = 'application/json'
            if csrf:
                if not self.csrf:
                    self.call('GET', '/auth/session.php')
                headers['X-CSRF-Token'] = self.csrf or ''
            data = json.dumps(body or {}).encode()
        req = urllib.request.Request(BASE + path + query, data=data, headers=headers, method=method)
        try:
            with self.opener.open(req, timeout=20) as r:
                status, raw = r.status, r.read()
        except urllib.error.HTTPError as e:
            status, raw = e.code, e.read()
        try:
            js = json.loads(raw or b'{}')
        except json.JSONDecodeError:
            js = {'_raw': raw[:300].decode(errors='replace')}
        d = js.get('data') if isinstance(js, dict) else None
        if isinstance(d, dict) and d.get('csrfToken'):
            self.csrf = d['csrfToken']
        # Same as the website (src/lib/api.ts): a stale CSRF token → fetch a fresh one and retry once.
        if status == 419 and csrf and method == 'POST' and not getattr(self, '_retrying', False):
            self.csrf = None
            self._retrying = True
            try:
                return self.call(method, path, body, csrf, query)
            finally:
                self._retrying = False
        if path == '/auth/logout.php' and status == 200:
            self.csrf = None
        return status, js

    get = lambda self, p, q='': self.call('GET', p, query=q)
    post = lambda self, p, b=None, csrf=True: self.call('POST', p, b, csrf)


def check(name, cond, detail=''):
    global passed, failed
    if cond:
        passed += 1
        print(f'  ✓ {name}')
    else:
        failed += 1
        print(f'  ✗ {name}  {detail}')


def day(offset):
    return (dt.date.today() + dt.timedelta(days=offset)).isoformat()


def register(c, name, email, phone, pw='TestPass2026'):
    return c.post('/auth/register.php', {'name': name, 'email': email, 'phone': phone, 'password': pw, 'confirmPassword': pw, 'acceptTerms': True})


def personal(name, email, phone):
    return {'name': name, 'email': email, 'phone': phone, 'dateOfBirth': '1995-06-15', 'gender': 'female', 'address': 'Station Road, Dhubulia, Nadia 741139'}


print(f'API test against {BASE}\n')

print('Health & public endpoints')
pub = Client()
s, j = pub.get('/')
check('health check returns 200', s == 200 and j.get('success'), j)
s, j = pub.get('/plans/list.php')
plans = (j.get('data') or {}).get('plans', [])
check('4 active plans', s == 200 and len(plans) == 4, j)
quarterly = next(p for p in plans if p['durationDays'] == 90)
monthly = next(p for p in plans if p['durationDays'] == 30)
s, j = pub.get('/gym/info.php')
check('gym info', s == 200 and j['data']['gym']['name'], j)
s, j = pub.get('/member/dashboard.php')
check('dashboard needs login (401)', s == 401, s)
s, j = pub.get('/admin/overview.php')
check('admin needs login (401)', s == 401, s)
s, j = pub.get('/plans/list.php', '?x=1')
s, j = pub.call('POST', '/plans/list.php', {})
check('wrong method rejected (405)', s == 405, s)

print('Registration')
m = Client()
email = f'member{RUN}@example.com'
s, j = m.post('/auth/register.php', {'name': 'X'}, csrf=False)
check('POST without CSRF token rejected (419)', s == 419, s)
s, j = m.post('/auth/register.php', {'name': 'Riya Test', 'email': email, 'phone': '9876543210', 'password': 'TestPass2026', 'confirmPassword': 'Other999', 'acceptTerms': True})
check('password mismatch rejected', s == 422 and 'confirmPassword' in j.get('errors', {}), j)
s, j = m.post('/auth/register.php', {'name': '', 'email': 'bad', 'phone': '123', 'password': 'short', 'confirmPassword': 'short'})
errs = j.get('errors', {})
check('field validation errors', s == 422 and {'name', 'email', 'phone', 'password', 'acceptTerms'} <= set(errs), errs)
s, j = register(m, 'Riya Test', email, '98765 43210')
check('register OK (201)', s == 201 and j['data']['user']['onboardingStatus'] == 'pending', j)
check('phone normalised to +91', j['data']['user']['phone'] == '+919876543210', j['data']['user'].get('phone'))
s, j = register(Client(), 'Dup', email, '9876543211')
check('duplicate email rejected', s == 422 and 'email' in j.get('errors', {}), j)
s, j = m.get('/auth/session.php')
check('session restored', j['data']['user']['email'] == email, j)

print('Onboarding & membership')
s, j = m.post('/member/onboarding.php', {'answer': 'maybe'})
check('bad onboarding answer rejected', s == 422, s)
start = day(-87)
body = {**personal('Riya Test', email, '9876543210'), 'planId': quarterly['id'], 'purchaseDate': day(-88), 'startDate': start, 'durationDays': 90, 'receiptNumber': f'APX-{RUN}'}
s, j = m.post('/member/membership.php', {**body, 'startDate': day(-80), 'purchaseDate': day(-70)})
check('start before purchase rejected', s == 422 and 'startDate' in j.get('errors', {}), j)
s, j = m.post('/member/membership.php', {**body, 'dateOfBirth': day(-365)})
check('implausible date of birth rejected', s == 422 and 'dateOfBirth' in j.get('errors', {}), j)
s, j = m.post('/member/membership.php', body)
mem = (j.get('data') or {}).get('membership', {})
check('membership added (201)', s == 201, j)
check('expiry = start + 90 days', mem.get('expiryDate') == day(3), mem)
check('3 days remaining, status expiring', mem.get('daysRemaining') == 3 and mem.get('status') == 'expiring', mem)
check('pending verification', mem.get('verificationStatus') == 'pending', mem)
s, j = m.post('/member/membership.php', body)
check('same membership twice rejected', s == 422, j)

s, j = m.get('/member/dashboard.php')
d = j.get('data', {})
types = sorted(n['type'] for n in d.get('notifications', []))
check('dashboard shows membership', d.get('membership', {}).get('id') == mem.get('id'), d.get('membership'))
check('dashboard notifications: added + 3-day reminder', types == ['membership_added', 'reminder_second'], types)
check('reminder text', any('expires in 3 days' in n['message'] for n in d.get('notifications', [])), d.get('notifications'))
unread = d.get('unreadCount')
for _ in range(3):
    m.get('/member/dashboard.php')
s, j = m.get('/member/notifications.php')
items, deliveries = j['data']['items'], j['data']['deliveries']
check('no duplicate reminders after reloads', len(items) == 2, [i['type'] for i in items])
check('email + WhatsApp reminder recorded once each', sorted(x['channel'] for x in deliveries) == ['email', 'whatsapp'], deliveries)
check('deliveries sent (log driver)', all(x['status'] == 'sent' for x in deliveries), deliveries)
s, j = m.post('/member/notifications.php', {'all': True})
s, j = m.get('/member/dashboard.php')
check('mark all read', j['data']['unreadCount'] == 0 and unread == 2, (unread, j['data']['unreadCount']))

print('Profile & password')
s, j = m.post('/member/profile.php', {**personal('Riya T', email, '9876543210'), 'emailOptIn': False, 'whatsappOptIn': True})
check('profile updated', s == 200 and j['data']['user']['name'] == 'Riya T' and j['data']['user']['emailOptIn'] is False, j)
s, j = m.post('/member/password.php', {'currentPassword': 'wrong', 'newPassword': 'NewPass2026'})
check('wrong current password rejected', s == 422, s)
s, j = m.post('/member/password.php', {'currentPassword': 'TestPass2026', 'newPassword': 'NewPass2026'})
check('password changed', s == 200, j)
s, j = m.post('/auth/logout.php')
check('logout', s == 200, j)
s, j = m.get('/member/dashboard.php')
check('logged out → 401', s == 401, s)
s, j = m.post('/auth/login.php', {'email': email, 'password': 'TestPass2026'})
check('old password no longer works', s == 401, s)
s, j = m.post('/auth/login.php', {'email': email.upper(), 'password': 'NewPass2026'})
check('login with new password (email case-insensitive)', s == 200, j)

print('Contact form')
s, j = pub.post('/contact/submit.php', {'name': 'Visitor', 'email': 'v@example.com', 'phone': '', 'topic': 'visit', 'message': 'Can I book a trial session this week?'})
check('contact message saved', s == 201, j)
s, j = pub.post('/contact/submit.php', {'name': 'V', 'email': 'nope', 'topic': 'visit', 'message': 'short'})
check('contact validation', s == 422, j)

print('Admin')
s, j = m.get('/admin/overview.php')
check('member cannot open admin (403)', s == 403, s)
admin_email = f'admin{RUN}@example.com'
a = Client()
register(a, 'Test Admin', admin_email, '9876500001')
out = subprocess.run(['php', os.path.join(ROOT, 'scripts', 'create-admin.php'), admin_email], capture_output=True, text=True, env=os.environ)
check('create-admin.php promotes account', 'now an admin' in out.stdout, out.stdout + out.stderr)
s, j = a.get('/admin/overview.php')
st = (j.get('data') or {}).get('stats', {})
check('admin overview', s == 200 and st.get('totalMembers', 0) >= 1, j)
check('expiring member counted', st.get('expiring', 0) >= 1 and st.get('pendingVerification', 0) >= 1, st)

m2c = Client()
email2 = f'second{RUN}@example.com'
register(m2c, 'Sourav Ghosh', email2, '9830011223')
s, j = a.get('/admin/customers.php', f'?q=second{RUN}')
items = j['data']['items']
check('customer search', s == 200 and len(items) == 1 and items[0]['email'] == email2, j)
cid = items[0]['id']
s, j = a.get('/admin/customers.php', '?status=none&perPage=100')
check('filter: no membership', any(c['id'] == cid for c in j['data']['items']), len(j['data']['items']))
s, j = a.post('/admin/customer.php', {'id': cid, 'action': 'add_membership', 'planId': monthly['id'], 'purchaseDate': day(-33), 'startDate': day(-32), 'durationDays': 30})
cm = j['data']['customer']['membership'] if s == 200 else {}
check('admin records membership (verified)', s == 200 and cm.get('verificationStatus') == 'verified', j)
check('expired 2 days ago', cm.get('status') == 'expired' and cm.get('expiryDate') == day(-2), cm)
check('expired notice sent', any(n['type'] == 'expired' for n in j['data']['notifications']), [n['type'] for n in j['data'].get('notifications', [])])
s, j = a.get('/admin/expiring.php')
e = j['data']
check('expiring groups', any(c['email'] == email for c in e['second']) and any(c['email'] == email2 for c in e['expired']), {k: len(v) for k, v in e.items() if isinstance(v, list)})
riya = next(c for c in e['second'] if c['email'] == email)
check('delivery status per channel', riya['delivery']['whatsapp']['status'] == 'sent' and riya['delivery']['dashboard']['status'] == 'sent', riya['delivery'])

renew_start = day(-2)
s, j = a.post('/admin/customer.php', {'id': cid, 'action': 'add_membership', 'planId': quarterly['id'], 'purchaseDate': day(-2), 'startDate': renew_start, 'durationDays': 90})
check('renewal becomes current', s == 200 and j['data']['customer']['membership']['status'] == 'active', j['data']['customer'].get('membership') if s == 200 else j)
mid = j['data']['customer']['membership']['id']
s, j = a.post('/admin/customer.php', {'id': cid, 'action': 'update_membership', 'membershipId': mid, 'planId': quarterly['id'], 'purchaseDate': day(-2), 'startDate': renew_start, 'durationDays': 95})
check('edit membership recalculates expiry', s == 200 and j['data']['customer']['membership']['expiryDate'] == day(93), j['data']['customer']['membership'] if s == 200 else j)
s, j = a.post('/admin/customer.php', {'id': cid, 'action': 'set_password', 'password': 'weak'})
check('reset password validates', s == 422, s)
s, j = a.post('/admin/customer.php', {'id': cid, 'action': 'set_password', 'password': 'Desk2026Pass'})
s2, _ = Client().post('/auth/login.php', {'email': email2, 'password': 'Desk2026Pass'})
check('staff password reset works', s == 200 and s2 == 200, (s, s2))

s, j = a.get('/admin/customers.php', f'?q={RUN}&status=pending')
rid = next(c['id'] for c in j['data']['items'] if c['email'] == email)
s, j = a.get('/admin/memberships.php', '?verification=pending&perPage=100')
pend = next(x for x in j['data']['items'] if x['userEmail'] == email)
s, j = a.post('/admin/customer.php', {'id': rid, 'action': 'verify_membership', 'membershipId': pend['id'], 'status': 'verified'})
check('verify member membership', s == 200 and j['data']['customer']['membership']['verificationStatus'] == 'verified', j)
check('member notified of verification', any(n['type'] == 'membership_verified' for n in j['data']['notifications']), [n['type'] for n in j['data']['notifications']])
s, j = a.post('/admin/customer.php', {'id': rid, 'action': 'update_profile', **personal('Riya Test', email, '9876543210'), 'notes': 'Prefers mornings', 'isActive': True, 'emailOptIn': True, 'whatsappOptIn': True})
check('admin edits customer + notes', s == 200 and j['data']['customer']['notes'] == 'Prefers mornings', j)

s, j = a.post('/admin/reminders.php')
check('manual reminder run: nothing new', s == 200 and j['data']['summary']['created'] == 0, j)
s, j = a.get('/admin/notifications.php', '?channel=whatsapp&perPage=50')
check('notification log filter', s == 200 and all(n['channel'] == 'whatsapp' for n in j['data']['items']) and j['data']['total'] >= 1, j.get('data', {}).get('total'))
sent_id = j['data']['items'][0]['id']
s, j = a.post('/admin/notifications.php', {'id': sent_id})
check('cannot retry an already-sent message (409)', s == 409, s)

s, j = a.post('/admin/plans.php', {'name': f'Student {RUN}', 'durationDays': 60, 'price': 2000, 'tagline': 'For students', 'features': ['Valid ID needed'], 'isActive': False})
check('create plan', s == 200 and j['data']['plan']['isActive'] is False, j)
pid = j['data']['plan']['id']
s, j = a.post('/admin/plans.php', {'id': pid, 'name': f'Student {RUN}', 'durationDays': 60, 'price': '', 'tagline': 'x', 'features': [], 'isActive': False})
check('edit plan (hide price)', s == 200 and j['data']['plan']['price'] is None, j)
s, j = pub.get('/plans/list.php')
check('hidden plan not public', all(p['id'] != pid for p in j['data']['plans']), len(j['data']['plans']))

s, j = a.get('/admin/settings.php')
check('settings load', s == 200 and j['data']['settings']['reminder_first_days'] == 5, j)
s, j = a.post('/admin/settings.php', {'reminder_first_days': 3, 'reminder_second_days': 3})
check('invalid reminder windows rejected', s == 422, j)
s, j = a.post('/admin/settings.php', {'gym_phone': '+91 98000 00000', 'gym_map_url': 'https://maps.google.com/?q=Apex'})
check('settings saved', s == 200 and j['data']['settings']['gym_phone'] == '+91 98000 00000', j)
s, j = pub.get('/gym/info.php')
check('public gym info updated', j['data']['gym']['phone'] == '+91 98000 00000', j)

s, j = a.get('/admin/messages.php')
msg = j['data']['items'][0]
s, j = a.post('/admin/messages.php', {'id': msg['id'], 'status': 'handled'})
check('inquiry marked handled', s == 200, j)

print('Security')
s, j = m.post('/admin/plans.php', {'name': 'Hack', 'durationDays': 1})
check('member cannot change plans (403)', s == 403, s)
evil = Client()
evil.get('/auth/session.php')
req = urllib.request.Request(BASE + '/auth/login.php', data=b'{}', headers={'Content-Type': 'application/json', 'X-CSRF-Token': evil.csrf, 'Origin': 'https://evil.example'}, method='POST')
try:
    evil.opener.open(req)
    code = 200
except urllib.error.HTTPError as e:
    code = e.code
check('foreign Origin blocked (403)', code == 403, code)
bf = Client()
codes = [bf.post('/auth/login.php', {'email': f'nobody{RUN}@example.com', 'password': 'wrongpass1'})[0] for _ in range(10)]
check('login brute force rate-limited (429)', 429 in codes, codes)

print(f'\n{"✓" if not failed else "✗"} {passed} passed, {failed} failed')
sys.exit(1 if failed else 0)
