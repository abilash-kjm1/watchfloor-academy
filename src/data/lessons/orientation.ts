import type { Lesson } from '../types'
import { res } from '../resources'

export const orientationLessons: Lesson[] = [
  {
    id: 'start-here',
    moduleId: 'orientation',
    title: 'Start here: what defenders do, and the words you need',
    summary: 'The job, the vocabulary (threat, vulnerability, risk, endpoint, log, alert, evidence) and how every lesson is organized.',
    mode: 'both', minutes: 20, levels: ['beginner', 'understand'], skills: ['soc'],
    sections: {},
    diagram: {
      title: 'The analyst loop you will learn',
      steps: [
        { label: 'Read the alert', detail: 'An automatic warning says something might be wrong.' },
        { label: 'Find the evidence', detail: 'Look at the records (logs) of what actually happened.' },
        { label: 'Decide', detail: 'Is it a real attack, approved activity, or a mistake in the rule?' },
        { label: 'Act', detail: 'Escalate, help stop the attack, or close it with a reason.' },
        { label: 'Write it down', detail: 'So the next person understands what you found and why.' },
      ],
    },
    sc200: { note: 'SC-200 assumes you already understand the analyst role and basic security vocabulary. This lesson gives you that foundation before any Microsoft product appears.', objectives: [] },
    lab: {
      title: 'Spot the threat, vulnerability and risk',
      environment: 'Paper exercise — no tools needed',
      steps: [
        'Scenario: a small company lets staff log in to email from anywhere with only a password. Phishing emails are common in their industry.',
        'Write down the threat, the vulnerability and the risk in one sentence each.',
        'Write one prevention step and one detection step that would reduce the risk.',
        'Open Event Viewer on a Windows PC (Start menu → type "Event Viewer"). Expand "Windows Logs" and click "Security". You are looking at real logs — the evidence this course teaches you to read.',
      ],
      reflect: ['Which of your two steps would a SOC analyst be responsible for?', 'What evidence would show that the risk actually happened?'],
    },
    quiz: [
      { id: 'q-start-1', prompt: 'A company\'s staff use weak passwords. In security terms, what is the weak password?', options: ['A threat', 'A vulnerability', 'A risk', 'An alert'], answer: [1], explanation: 'A vulnerability is a weakness that could be used. The threat is whoever might use it; the risk is how likely and how harmful that would be.', whyWrong: { 0: 'A threat is who or what could cause harm — for example, an attacker — not the weakness itself.', 2: 'Risk combines likelihood and impact; the weak password is one ingredient of the risk.' }, concept: 'Threat vs vulnerability vs risk', skill: 'soc', kind: 'knowledge' },
      { id: 'q-start-2', prompt: 'What is the main job of a SOC analyst?', options: ['Writing new software', 'Noticing, investigating and helping stop attacks that get past prevention', 'Fixing printers', 'Selling security products'], answer: [1], explanation: 'SOC analysts focus on detection and response: reading alerts, checking evidence, deciding what is real, and helping respond.', concept: 'SOC analyst role', skill: 'soc', kind: 'knowledge' },
      { id: 'q-start-3', prompt: 'An alert says a user signed in from another country. What should an analyst do first?', options: ['Immediately lock the account', 'Check the evidence and context, such as whether the user is travelling', 'Ignore it — travel is normal', 'Delete the logs'], answer: [1], explanation: 'Unusual is not the same as malicious. Analysts check evidence and context before acting.', concept: 'Evidence before verdict', skill: 'soc', kind: 'scenario' },
      { id: 'q-start-4', prompt: 'Why do security teams call laptops, desktops and servers "endpoints"?', options: ['They are where the network ends and people actually work', 'They are always the last device purchased', 'They only connect at the end of the day', 'It is a brand name'], answer: [0], explanation: 'Endpoints are the devices at the "ends" of the network — where users and programs actually do things, and where much of the evidence is created.', concept: 'Endpoint', skill: 'computers', kind: 'knowledge' },
    ],
    interview: ['iv-threat-vuln-risk', 'iv-what-is-soc'],
    mistakes: ['Using threat, vulnerability and risk as if they mean the same thing.', 'Assuming every alert is an attack.', 'Skipping the "why" and memorizing terms.'],
    tip: 'Keep a personal glossary in the Notes page. Write each new term in your own words — if you can\'t, re-read that part of the lesson.',
    think: { prompt: 'Your manager asks: "If we have good passwords and antivirus, why do we need a SOC?" What do you answer?', answer: 'Prevention lowers risk but never removes it — passwords get stolen, people get tricked, new attacks appear. A SOC notices when prevention fails and limits the damage. Without one, attacks are often found weeks later, or by someone outside the company.' },
    takeaways: ['Security = prevention + detection and response; SOC analysts focus on detection and response.', 'Threat = who/what could harm you; vulnerability = a weakness; risk = likelihood × impact.', 'Analysts work from evidence (records), not assumptions.', 'Every lesson builds in levels from simple to advanced.'],
    connect: ['soc', 'event', 'log', 'alert', 'triage', 'incident'],
    resources: res('messerSec', 'zeroTrust', 'sc200Exam'),
  },
]
