# Oral Journal

**Oral Journal helps teachers hear how students think, not only whether they reached the right answer.**

Teachers define a question, success criteria, and common misconceptions. Students explain a concept in their own words through a short oral knowledge journal. The product then organizes evidence from those explanations so students know what to clarify and teachers can see the class-wide ideas that need attention.

## The problem

Written answers and multiple-choice quizzes can reveal whether a student selected the right answer, but they often hide *how* that student is reasoning. It is difficult for one teacher to listen to every learner's explanation, identify misconceptions, and turn those observations into a useful next lesson.

Oral Journal is a formative-learning tool, not an automated oral exam. It supports the teacher's professional judgment by making student explanations easier to review and compare against teacher-defined standards.

## How it works

1. **A teacher creates an oral task.** They provide a question, the knowledge points students should explain, and common misconceptions to watch for.
2. **A student records a first explanation.** A short spoken response is transcribed; a text-entry fallback can be used when recording is unavailable.
3. **AI organizes the evidence.** Using only the teacher's criteria, it identifies ideas the student expressed, ideas that were not yet expressed, and possible misconceptions or unclear reasoning.
4. **The student explains again.** The follow-up prompt focuses on a specific missing point, rather than asking the student to repeat everything.
5. **The teacher sees the learning pattern.** A class understanding map aggregates secure knowledge points, ideas to strengthen, and common misconceptions, enabling a targeted next activity.

## Demo scenario

The current prototype uses a Grade 5 mathematics task:

> Why is `3/4` greater than `2/3`?

The teacher's success criteria include:

- Recognizing that fractions must refer to the same whole.
- Explaining the meaning of numerator and denominator.
- Finding common denominators.
- Giving both a conclusion and a reason.

The dashboard highlights a typical misconception: **“A larger denominator means a larger fraction.”** It then suggests a short classroom activity based on equally sized pizzas.

## Current prototype

The first prototype is a responsive, English-language teacher dashboard. It includes:

- A class overview and active-task summary.
- A class understanding map organized by knowledge point.
- Counts for students who are secure or need further explanation.
- Common misconceptions and a teacher-facing next-step suggestion.
- A list of journals that need attention.
- A task-creation modal with editable question and knowledge-point criteria.
- A sample “5-minute review activity” interaction.

The dashboard currently uses static demo data. It does **not** yet record student audio, transcribe speech, call an AI model, persist data, authenticate users, or send notifications.

## Product principles

- **Teacher-defined criteria come first.** AI should organize evidence against the teacher's goals; it should not silently invent a rubric.
- **Explanation is more important than fluency.** Accent, confidence, or speaking pace should not be treated as proof of understanding.
- **AI assists; teachers decide.** Teachers can review uncertain records and retain final judgment.
- **Feedback is constructive.** The product should name ideas to clarify, not label students as failures.
- **Student data deserves care.** Audio, transcripts, and AI processing must be transparent and handled with appropriate consent and privacy protections.

## Planned next steps

1. Build the student journal page with audio recording and a transcript/text fallback.
2. Add a server-side analysis endpoint that returns structured evidence:

   ```ts
   {
     mentioned: string[];
     missing: string[];
     misconceptions: string[];
     feedback: string;
     followUpPrompt: string;
   }
   ```

3. Compare a student's first and second explanations by knowledge point.
4. Replace static dashboard values with aggregated class data.
5. Add a teacher review queue for low-confidence or incomplete transcripts.

Future versions may introduce spaced follow-up prompts based on specific missing knowledge points. Those reminders should be optional and supportive, never punitive.

## Run locally

This initial prototype is a dependency-free static page.

1. Clone the repository.
2. Open `index.html` in a browser.

For a local web server, from the project directory run:

```bash
python3 -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000).

## Project status

This is an early hackathon prototype. The visual dashboard and interactions demonstrate the product direction; the AI, voice, persistence, and classroom workflows described above are planned implementation work, not claims about currently available functionality.

## Demo login

Open the root URL to sign in. `teacher@oraljournal.demo` opens `teacher.html`; `student@oraljournal.demo` opens `student.html`. The demo buttons fill an email; Continue opens its workspace. Unknown emails show an error. Add demo accounts in `session.js`.

Sessions last for the browser tab and survive refresh. Both workspaces show the current email and a Sign out button, including on mobile. Direct visits without a session return to login; mismatched roles return to their own workspace. These client-side checks are demo navigation only, not authentication or server authorization.
