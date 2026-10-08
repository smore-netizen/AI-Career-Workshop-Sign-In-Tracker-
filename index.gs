
 * AI & YOUR CAREER: Workshop Sign-Up Builder
 * ------------------------------------------------------------
 * One run builds everything:
 *   1. The Google Form (per-session sign-up)
 *   2. A linked Google Sheet with a live Dashboard tab
 *   3. A "QR Links" tab with one tracked link per marketing channel
 *   4. An auto-confirmation email (with Add-to-Calendar links)
 *   5. Automatic reminder emails the day before each session
 *
 * HOW TO RUN (desktop, about 2 minutes):
 *   1. Go to script.google.com > New project
 *   2. Delete the starter code, paste this whole file, click Save
 *   3. In the function dropdown pick  buildEverything  and click Run
 *   4. Approve the permissions (Google will say "unverified app": it's
 *      your own script. Click Advanced > Go to project)
 *   5. Open View > Logs (or Execution log). Copy the links it prints.
 */

// ===== EDIT HERE IF ANYTHING CHANGES =====================================
const CONFIG = {
  title: 'AI & Your Career | Workshop Sign-Up',
  room: 'CCB 341',
  time: '2:30 to 3:30 PM',
  tz: 'America/Los_Angeles',
  presenter: 'Savanna Morris',
  replyTo: 'savanna.morris@pepperdine.edu',
  sessions: [
    { key: 'Session 1', label: 'Session 1 · Wed, Nov 4 · Career-Building: turn AI into a career system',
      name: 'Career-Building', date: '2026-11-04',
      bring: 'Your resume (or a list of your experiences) and one real job or internship posting you care about.' },
    { key: 'Session 2', label: 'Session 2 · Wed, Nov 11 · Tool-Focused: right AI for the job, resume stress-test, mock interview',
      name: 'Tool-Focused', date: '2026-11-11',
      bring: 'Your Session 1 AI profile, one resume bullet or cover letter paragraph, and free accounts on at least two of Claude, ChatGPT, Gemini.' },
    { key: 'Session 3', label: 'Session 3 · Wed, Dec 2 · Skills-Focused: talk about AI skills like a hire, not a user',
      name: 'Skills-Focused', date: '2026-12-02',
      bring: 'One resume bullet about your tech or AI skills (even a weak one) and your work from Sessions 1 and 2.' },
  ],
  startHHMM: '14:30',
  endHHMM: '15:30',
  channels: ['Flyer on campus', 'Instagram', 'Career Center email / Handshake',
             'Professor or class announcement', 'Club or student org', 'Friend', 'LinkedIn', 'Digital screen on campus'],
};
// =========================================================================

const Q = {
  name: 'First and last name',
  email: 'Pepperdine email',
  sessions: 'Which sessions are you coming to?',
  school: 'Your school',
  year: 'Class year',
  major: 'Major or program',
  comfort: 'How much do you use AI for career stuff right now?',
  goal: 'What do you want to walk out with? (optional)',
  source: 'How did you hear about this?',
  updates: 'Send me the prompt pack after each session?',
};

function buildEverything() {
  // ---------- 1. FORM ----------
  const form = FormApp.create(CONFIG.title);
  form.setDescription(
    'A 3-part, hands-on workshop series on using AI to build your career. ' +
    'Any major. Any year. Free AI accounts work.\n\n' +
    'Every Wednesday session runs ' + CONFIG.time + ' in ' + CONFIG.room + '. ' +
    'Bring a laptop. Come to one, come to all three (each builds on the last).\n\n' +
    'Led by ' + CONFIG.presenter + ', hosted with the Pepperdine Career Center.'
  );
  form.setConfirmationMessage(
    "You're in. Check your inbox for a confirmation with calendar links. " +
    'Bring a laptop and a real job posting you care about. See you in ' + CONFIG.room + '.'
  );
  form.setProgressBar(false);
  form.setShowLinkToRespondAgain(false);
  form.setAllowResponseEdits(true);

  form.addTextItem().setTitle(Q.name).setRequired(true);

  form.addTextItem().setTitle(Q.email).setRequired(true)
    .setHelpText('We send your confirmation and reminders here.')
    .setValidation(FormApp.createTextValidation()
      .requireTextMatchesPattern('(?i)^[A-Za-z0-9._%+-]+@pepperdine\\.edu$')
      .setHelpText('Use your @pepperdine.edu email.').build());

  form.addCheckboxItem().setTitle(Q.sessions).setRequired(true)
    .setHelpText('Pick as many as you want. All three is the full system.')
    .setChoiceValues(CONFIG.sessions.map(s => s.label));

  form.addMultipleChoiceItem().setTitle(Q.school).setRequired(true)
    .setChoiceValues(['Seaver College', 'Graziadio Business School', 'Caruso School of Law',
      'Graduate School of Education and Psychology', 'School of Public Policy'])
    .showOtherOption(true);

  form.addMultipleChoiceItem().setTitle(Q.year).setRequired(true)
    .setChoiceValues(['2027', '2028', '2029', '2030', 'Grad student'])
    .showOtherOption(true);

  form.addTextItem().setTitle(Q.major).setRequired(false);

  form.addScaleItem().setTitle(Q.comfort).setRequired(true)
    .setBounds(1, 5).setLabels('Never tried it', 'I use it for real work every week');

  form.addParagraphTextItem().setTitle(Q.goal).setRequired(false)
    .setHelpText('Example: a resume that gets past screening, interview reps, a plan for a career switch.');

  const sourceItem = form.addMultipleChoiceItem().setTitle(Q.source).setRequired(true)
    .setChoiceValues(CONFIG.channels).showOtherOption(true);

  form.addMultipleChoiceItem().setTitle(Q.updates).setRequired(true)
    .setChoiceValues(['Yes, send it', 'No thanks']);

  // ---------- 2. SHEET ----------
  const ss = SpreadsheetApp.create('AI & Your Career | Sign-Up Tracker');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  SpreadsheetApp.flush();
  Utilities.sleep(3000);
  const respSheet = ss.getSheets().filter(sh => sh.getFormUrl())[0] || ss.getSheets()[0];
  const R = "'" + respSheet.getName() + "'";

  // Dashboard
  const dash = ss.insertSheet('Dashboard', 0);
  const col = h => 'INDEX(' + R + '!A2:Z,0,MATCH("' + h.replace(/"/g, '""') + '",' + R + '!A1:Z1,0))';
  const rows = [
    ['AI & YOUR CAREER · SIGN-UP DASHBOARD', ''],
    ['', ''],
    ['Total sign-ups', '=COUNTA(' + col(Q.email) + ')'],
    ['Unique emails', '=IFERROR(COUNTA(UNIQUE(FILTER(LOWER(' + col(Q.email) + '),' + col(Q.email) + '<>""))),0)'],
    ['Signed up for all 3', '=IFERROR(SUMPRODUCT(ISNUMBER(SEARCH("Session 1",' + col(Q.sessions) + '))*ISNUMBER(SEARCH("Session 2",' + col(Q.sessions) + '))*ISNUMBER(SEARCH("Session 3",' + col(Q.sessions) + '))),0)'],
    ['', ''],
    ['HEADCOUNT BY SESSION', ''],
  ];
  CONFIG.sessions.forEach(s => rows.push([s.key + ' · ' + s.name + ' (' + s.date + ')', '=COUNTIF(' + col(Q.sessions) + ',"*' + s.key + '*")']));
  rows.push(['Room capacity (edit me)', 40]);
  rows.push(['', '']);
  rows.push(['WHERE THEY HEARD ABOUT IT', '']);
  CONFIG.channels.forEach(c => rows.push([c, '=COUNTIF(' + col(Q.source) + ',"' + c + '")']));
  rows.push(['', '']);
  rows.push(['BY SCHOOL', '']);
  ['Seaver College', 'Graziadio Business School', 'Caruso School of Law',
   'Graduate School of Education and Psychology', 'School of Public Policy']
    .forEach(c => rows.push([c, '=COUNTIF(' + col(Q.school) + ',"' + c + '")']));
  rows.push(['', '']);
  rows.push(['Avg AI comfort (1 to 5)', '=IFERROR(ROUND(AVERAGE(' + col(Q.comfort) + '),1),"")']);
  rows.push(['Want the prompt pack', '=COUNTIF(' + col(Q.updates) + ',"Yes*")']);

  dash.getRange(1, 1, rows.length, 2).setValues(rows);
  dash.setColumnWidth(1, 380); dash.setColumnWidth(2, 120);
  dash.getRange('A1').setFontSize(14).setFontWeight('bold').setFontColor('#E65526');
  dash.getRange(1, 1, rows.length, 2).setFontFamily('Arial');
  rows.forEach((r, i) => {
    if (r[1] === '' && r[0] && i > 0) dash.getRange(i + 1, 1).setFontWeight('bold').setFontColor('#1E2859');
  });

  // Attendance tab (mark who actually showed up)
  const att = ss.insertSheet('Attendance');
  att.getRange(1, 1, 1, 5).setValues([['Name', 'Email', 'S1 Nov 4', 'S2 Nov 11', 'S3 Dec 2']]).setFontWeight('bold');
  att.getRange('A2').setFormula('=FILTER(' + col(Q.name) + ',' + col(Q.name) + '<>"")');
  att.getRange('B2').setFormula('=FILTER(' + col(Q.email) + ',' + col(Q.email) + '<>"")');
  att.getRange('C2:E400').insertCheckboxes();
  att.getRange('G1').setValue('Check the box when someone shows up. Show rate = checked / signed up.');

  // ---------- 3. TRACKED QR LINKS ----------
  const links = ss.insertSheet('QR Links');
  const linkRows = [['Channel', 'Tracked link (make a QR from this)']];
  const mc = sourceItem.asMultipleChoiceItem();
  CONFIG.channels.forEach(c => {
    const url = form.createResponse().withItemResponse(mc.createResponse(c)).toPrefilledUrl();
    linkRows.push([c, url]);
  });
  linkRows.push(['Generic (no source prefilled)', form.getPublishedUrl()]);
  links.getRange(1, 1, linkRows.length, 2).setValues(linkRows);
  links.getRange('A1:B1').setFontWeight('bold');
  links.setColumnWidth(1, 260); links.setColumnWidth(2, 700);

  // ---------- 4 + 5. EMAIL TRIGGERS ----------
  PropertiesService.getScriptProperties().setProperties({ formId: form.getId(), sheetId: ss.getId() });
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('onSignup').forForm(form).onFormSubmit().create();
  CONFIG.sessions.forEach((s, i) => {
    const when = dayBefore10am_(s.date);
    if (when > new Date()) ScriptApp.newTrigger('remind' + (i + 1)).timeBased().at(when).create();
  });

  // ---------- OUTPUT ----------
  Logger.log('FORM (share this): ' + form.getPublishedUrl());
  Logger.log('FORM (edit): ' + form.getEditUrl());
  Logger.log('TRACKER SHEET: ' + ss.getUrl());
  Logger.log('Tracked QR links are in the "QR Links" tab of the sheet.');
  linkRows.slice(1).forEach(r => Logger.log(r[0] + ' -> ' + r[1]));
}

// ===== EMAILS =============================================================
function onSignup(e) {
  const answers = {};
  e.response.getItemResponses().forEach(ir => answers[ir.getItem().getTitle()] = ir.getResponse());
  const email = String(answers[Q.email] || '').trim();
  if (!email) return;
  const first = String(answers[Q.name] || '').trim().split(/\s+/)[0] || 'there';
  const picked = CONFIG.sessions.filter(s => (answers[Q.sessions] || []).some(a => a.indexOf(s.key) === 0));

  const blocks = picked.map(s =>
    '<tr><td style="padding:12px 0;border-bottom:1px solid #e5e7f0">' +
    '<b style="color:#E65526">' + s.key.toUpperCase() + '</b> &nbsp;' + prettyDate_(s.date) + '<br>' +
    '<b style="font-size:16px;color:#1E2859">' + s.name + '</b><br>' +
    '<span style="color:#555">Bring: ' + s.bring + '</span><br>' +
    '<a href="' + calLink_(s) + '" style="color:#E65526;font-weight:bold">+ Add to Google Calendar</a></td></tr>'
  ).join('');

  const html =
    '<div style="font-family:Arial,sans-serif;max-width:560px;color:#222">' +
    '<div style="background:#1E2859;color:#fff;padding:22px 24px;border-radius:8px 8px 0 0">' +
    '<div style="color:#E65526;font-size:11px;letter-spacing:2px;font-weight:bold">AI &amp; YOUR CAREER · WORKSHOP SERIES</div>' +
    '<div style="font-size:24px;font-weight:bold;margin-top:6px">You\'re in, ' + first + '.</div></div>' +
    '<div style="padding:8px 24px 20px;border:1px solid #e5e7f0;border-top:0;border-radius:0 0 8px 8px">' +
    '<p>' + CONFIG.time + ' · ' + CONFIG.room + '. Bring a laptop. Free accounts on Claude, ChatGPT, or Gemini are enough.</p>' +
    '<table style="width:100%;border-collapse:collapse">' + blocks + '</table>' +
    '<p style="margin-top:18px">You\'ll get a reminder the day before each session. Can\'t make it anymore? Just reply and let me know so someone else can grab the seat.</p>' +
    '<p>See you there,<br><b>' + CONFIG.presenter + '</b></p></div></div>';

  MailApp.sendEmail({ to: email, replyTo: CONFIG.replyTo, name: CONFIG.presenter + ' · AI & Your Career',
    subject: "You're in: AI & Your Career", htmlBody: html });
}

function remind1() { sendReminder_(0); }
function remind2() { sendReminder_(1); }
function remind3() { sendReminder_(2); }

function sendReminder_(i) {
  const s = CONFIG.sessions[i];
  const form = FormApp.openById(PropertiesService.getScriptProperties().getProperty('formId'));
  const seen = {};
  form.getResponses().forEach(r => {
    const a = {};
    r.getItemResponses().forEach(ir => a[ir.getItem().getTitle()] = ir.getResponse());
    const email = String(a[Q.email] || '').trim().toLowerCase();
    const going = (a[Q.sessions] || []).some(x => x.indexOf(s.key) === 0);
    if (!email || !going || seen[email]) return;
    seen[email] = true;
    const first = String(a[Q.name] || '').trim().split(/\s+/)[0] || 'there';
    MailApp.sendEmail({ to: email, replyTo: CONFIG.replyTo, name: CONFIG.presenter + ' · AI & Your Career',
      subject: 'Tomorrow: ' + s.key + ' · ' + s.name + ' (' + CONFIG.room + ')',
      htmlBody: '<div style="font-family:Arial,sans-serif;max-width:560px">' +
        '<p>Hey ' + first + ',</p><p>Quick reminder: <b>' + s.key + ' · ' + s.name + '</b> is tomorrow, ' +
        prettyDate_(s.date) + ', ' + CONFIG.time + ' in <b>' + CONFIG.room + '</b>.</p>' +
        '<p><b>Bring:</b> a laptop. ' + s.bring + '</p>' +
        '<p>Can\'t make it? Reply and let me know.</p><p>See you there,<br>' + CONFIG.presenter + '</p></div>' });
  });
  Logger.log('Reminders sent for ' + s.key + ': ' + Object.keys(seen).length);
}

// Manual test: sends the confirmation email to yourself
function testConfirmationToMe() {
  const me = Session.getActiveUser().getEmail();
  const fake = { response: { getItemResponses: () => [
    { getItem: () => ({ getTitle: () => Q.name }), getResponse: () => 'Test Person' },
    { getItem: () => ({ getTitle: () => Q.email }), getResponse: () => me },
    { getItem: () => ({ getTitle: () => Q.sessions }), getResponse: () => CONFIG.sessions.map(s => s.label) },
  ] } };
  onSignup(fake);
  Logger.log('Test confirmation sent to ' + me);
}

// ===== HELPERS ============================================================
function dayBefore10am_(isoDate) {
  const d = new Date(isoDate + 'T10:00:00-08:00');
  d.setDate(d.getDate() - 1);
  return d;
}
function prettyDate_(isoDate) {
  return Utilities.formatDate(new Date(isoDate + 'T12:00:00-08:00'), CONFIG.tz, 'EEEE, MMM d');
}
function calLink_(s) {
  const d = s.date.replace(/-/g, '');
  const t = h => h.replace(':', '') + '00';
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    '&text=' + encodeURIComponent('AI & Your Career · ' + s.key + ': ' + s.name) +
    '&dates=' + d + 'T' + t(CONFIG.startHHMM) + '/' + d + 'T' + t(CONFIG.endHHMM) +
    '&ctz=' + encodeURIComponent(CONFIG.tz) +
    '&location=' + encodeURIComponent(CONFIG.room + ', Pepperdine University') +
    '&details=' + encodeURIComponent('Bring a laptop. ' + s.bring);
}
