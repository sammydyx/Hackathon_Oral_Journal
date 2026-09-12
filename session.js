// Demo identity mapping only. Production authentication requires a trusted backend.
window.OralJournal = {
  accounts: {
    'teacher@oraljournal.demo': 'teacher',
    'student@oraljournal.demo': 'student'
  },
  signIn(email, role) {
    try { sessionStorage.setItem('oral-journal-session', JSON.stringify({ email, role })); }
    catch { document.querySelector('#login-error').textContent = 'Please enable browser storage to continue.'; document.querySelector('#login-error').hidden = false; return; }
    location.assign(role === 'teacher' ? 'teacher.html' : 'student.html');
  },
  read() {
    try {
      const session = JSON.parse(sessionStorage.getItem('oral-journal-session'));
      return session && this.accounts[session.email] === session.role ? session : null;
    } catch { return null; }
  },
  signOut() { try { sessionStorage.removeItem('oral-journal-session'); } finally { location.replace('index.html'); } },
  guard(role) {
    const session = this.read();
    if (!session) { location.replace('index.html'); return; }
    if (session.role !== role) { location.replace(session.role === 'teacher' ? 'teacher.html' : 'student.html'); return; }
    document.querySelectorAll('[data-session-email]').forEach(element => element.textContent = session.email);
    document.querySelectorAll('[data-sign-out]').forEach(button => button.onclick = () => this.signOut());
  }
};
