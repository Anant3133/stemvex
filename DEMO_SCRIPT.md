# Stemvex Demo Video Script
## Duration: ~8-10 minutes

---

## 👥 Characters

- **Alex** (Product Lead / Technical Demo) - Enthusiastic, technical but approachable
- **Jordan** (STEM Educator / User Perspective) - Practical, represents the end-user voice

---

## 🎬 SCENE 1: INTRODUCTION & PROBLEM SETUP
*[Screen: Adobe Express open with blank canvas]*

---

**Alex:**  
Hey everyone! I'm Alex, and today I'm super excited to show you something that's going to completely transform how you create technical content in Adobe Express.

**Jordan:**  
And I'm Jordan, a high school physics teacher. I've been beta testing this tool for the past few weeks, and honestly, it's solved a problem I didn't even realize had a solution.

**Alex:**  
So Jordan, before we dive into the demo, tell us - what was your biggest pain point when creating teaching materials?

**Jordan:**  
*[sighs]* Oh man, where do I start? So picture this: I'm preparing a presentation on Einstein's theory of relativity. I need to include equations like E = mc², the Lorentz transformation, maybe some calculus for the advanced class...

**Alex:**  
Sounds straightforward?

**Jordan:**  
You'd think! But here's what my workflow looked like: First, I'd open a LaTeX editor - usually Overleaf - and spend 20 minutes getting the equation syntax just right. Then I'd export it as a PDF, screenshot it, crop it in another tool, save it as a PNG, import it into Adobe Express, and hope it doesn't look pixelated when I resize it.

**Alex:**  
So you're juggling... what, four or five different applications?

**Jordan:**  
At least! And don't even get me started on when I need to scan equations from a textbook. I'd use my phone to take a photo, run it through some OCR service that barely understands math symbols, manually fix all the errors, then start the whole LaTeX-to-image cycle again.

**Alex:**  
That's painful. And that's exactly why we built **Stemvex**.

*[Screen: Stemvex logo animation]*

**Jordan:**  
Tell them what it stands for - I love this.

**Alex:**  
STEM-VEX. STEM for science, technology, engineering, and mathematics. VEX for **V**isual **EX**pression. It's the bridge between technical accuracy and visual storytelling.

---

## 🎬 SCENE 2: FIRST LOOK & SETUP
*[Screen: Adobe Express with Stemvex add-on panel opening]*

**Alex:**  
Alright, let's jump right in. I'm here in Adobe Express, and I'm going to load the Stemvex add-on. If you're in developer mode - which is what we're using for the beta - you just add your local server URL. Once we launch publicly, you'll find us directly in the Adobe Express marketplace.

*[Click to open add-on panel]*

**Jordan:**  
And look at that - it just loads right inside your workspace. No new tabs, no context switching.

**Alex:**  
Exactly. Now, you'll see we have three main modes here:  
1. **Direct LaTeX Input** - for when you know exactly what equation you want  
2. **Image Digitizer** - our AI-powered OCR scanner  
3. **Text Parser** - for processing entire paragraphs with mixed content

Jordan, which one should we start with?

**Jordan:**  
Let's start simple - Direct LaTeX Input. Show them how fast this can be.

---

## 🎬 SCENE 3: DEMO 1 - DIRECT LATEX INPUT
*[Screen: Stemvex panel showing LaTeX input field]*

**Alex:**  
Perfect. So imagine you want to insert Einstein's famous equation. I'm going to type it in LaTeX: `E = mc^{2}`

*[Types in the input field]*

**Jordan:**  
Notice he's not wrapping it in dollar signs or anything - Stemvex handles that automatically.

**Alex:**  
Great catch! Traditional LaTeX requires delimiters like `$E = mc^{2}$`, but we strip those for you. Keep it simple. Now I'm just going to click "Insert Equation."

*[Click button - show brief loading animation]*

**Jordan:**  
And... there it is! On your canvas, ready to go.

*[Screen: PNG equation appears on Adobe Express canvas]*

**Alex:**  
Look at that quality. This is a high-resolution PNG, transparent background, and it's now a native Adobe Express graphic. Jordan can resize it, rotate it, layer it - it's just another design element.

**Jordan:**  
This took what, 10 seconds?

**Alex:**  
From typing to insertion? About 8 seconds. Compare that to your old workflow.

**Jordan:**  
My old workflow for this one equation? At least 3-4 minutes. And I'm not exaggerating.

**Alex:**  
Now, here's something cool - we have an **Example Library**. See these buttons? 

*[Scroll through example buttons]*

These are 17 pre-built equations covering everything from basic algebra to complex calculus, matrices, summations...

**Jordan:**  
This is a lifesaver for educators. Click "Quadratic Formula" for me.

**Alex:**  
*[Clicks example button]*  

*[Screen: LaTeX input auto-fills with quadratic formula]*

See? The entire LaTeX just populated:  
`\frac{-b \pm \sqrt{b^{2} - 4ac}}{2a}`

**Jordan:**  
I use this constantly. I'll modify these templates for my specific needs. Way faster than typing from scratch.

**Alex:**  
*[Clicks Insert]*

*[Screen: Beautiful quadratic formula appears on canvas]*

And there's your quadratic formula, publication-quality, in seconds.

---

## 🎬 SCENE 4: DEMO 2 - IMAGE DIGITIZER (OCR)
*[Screen: Switch to "Image Digitizer" tab]*

**Jordan:**  
Okay, this next feature is honestly magic. Show them the OCR.

**Alex:**  
Alright, so Image Digitizer is our AI-powered scanner. Jordan, you brought a textbook page, right?

**Jordan:**  
Yep! This is from an introductory calculus textbook - limits chapter. Let me share my screen.

*[Screen: Shows photo of textbook page with equations and text]*

**Jordan:**  
So this page has a mix of explanatory text and about five different limit equations. Normally, if I wanted to use any of these in my presentation, I'd have to manually type them all out in LaTeX.

**Alex:**  
Not anymore. I'm going to drag and drop this image right into Stemvex.

*[Drag image file into upload zone]*

**Jordan:**  
Look at the preview - that's the image loaded and ready.

**Alex:**  
Now, behind the scenes, we're using **Google Gemini 2.0 Flash** with a custom system prompt we designed specifically for academic content. This isn't just generic OCR - it understands mathematical notation, context, and structure.

I'm clicking "Scan Image" now.

*[Click button - show loading spinner]*

**Jordan:**  
This usually takes about 5-10 seconds depending on image complexity.

**Alex:**  
And... done!

*[Screen: Results panel shows extracted text and LaTeX]*

**Jordan:**  
Wow, look at that! It pulled out all five limit equations perfectly:

- The basic limit definition  
- The epsilon-delta formulation  
- A continuity example  
- L'Hôpital's rule  
- And even that complex indeterminate form

**Alex:**  
See the structure it maintained? It separated the explanatory text from the math. Each equation is tagged with its classification - "Calculus (Limits)" in this case.

**Jordan:**  
And here's the best part - I can review each one before inserting. If there's any OCR error, I can edit the LaTeX right here in the preview.

**Alex:**  
Exactly. We prioritize accuracy over automation. But look - these are all correct. So I'm going to click "Insert All."

*[Click "Insert All" button]*

*[Screen: All 5 equations appear on canvas in a grid layout]*

**Jordan:**  
In under 30 seconds, we went from a textbook photo to five editable, high-quality graphics on my canvas.

**Alex:**  
And Jordan, you can now arrange these however you want - create a comparison slide, build a step-by-step derivation...

**Jordan:**  
This would have taken me 15-20 minutes manually. Per page. I'm saving hours every week.

---

## 🎬 SCENE 5: DEMO 3 - TEXT PARSER
*[Screen: Switch to "Text Parser" tab]*

**Alex:**  
Alright, final core feature - the Text Parser. This one's for when you have an entire document or paragraph with embedded math.

**Jordan:**  
Like if you copy-paste from a research paper or PDF?

**Alex:**  
Exactly. Let me grab some sample text. I'm going to paste this paragraph about thermodynamics:

*[Pastes text into input area]*

*[Screen shows text: "The first law of thermodynamics states that $\Delta U = Q - W$, where $\Delta U$ is the change in internal energy. For an ideal gas, we can express this using the equation $PV = nRT$. The entropy change is given by $$\Delta S = \int \frac{dQ}{T}$$, which leads to..."]*

**Jordan:**  
So this has inline math with single dollar signs, and display equations with double dollar signs.

**Alex:**  
Right. Now watch this - I click "Analyze Text."

*[Click analyze button]*

*[Screen: Parser results show tokens separated - Text blocks in one color, Math in another]*

**Jordan:**  
Whoa, it automatically detected and classified everything!

**Alex:**  
See the token breakdown?  
- "Text" blocks for the prose  
- "Inline Math" for `$\Delta U = Q - W$`  
- "Display Math" for the integral  

And it even classified them by type - thermodynamics, ideal gas law, calculus integral.

**Jordan:**  
This is impressive. So if I wanted just the equations...

**Alex:**  
You can select individual ones, or click "Insert All Math" to batch insert just the equations.

*[Click "Insert All Math"]*

*[Screen: Three equations appear on canvas]*

**Jordan:**  
Perfect for creating equation reference sheets or flashcards.

**Alex:**  
And the text portions are preserved too - you could export that separately as speaking notes or slide text.

---

## 🎬 SCENE 6: TECHNICAL DEEP DIVE
*[Screen: Split screen - UI Runtime and Document Sandbox diagram]*

**Alex:**  
Okay, for the tech-savvy folks watching - let me quickly explain why Stemvex works so smoothly. Adobe Express uses a two-runtime architecture.

**Jordan:**  
In English, Alex.

**Alex:**  
*[laughs]* Right! So basically, the add-on runs in two separate environments that talk to each other. The **UI Runtime** - that's where you see our interface - handles all the visual processing. It uses **KaTeX**, which is Khan Academy's LaTeX renderer, super fast and reliable.

**Jordan:**  
That's the same tech Khan Academy uses for all their math lessons, right?

**Alex:**  
Exactly! Battle-tested by millions of students. We render the LaTeX to HTML, then use a tool called html2canvas to convert it to a PNG image.

**Jordan:**  
Why PNG instead of vector graphics?

**Alex:**  
Great question. Adobe Express SDK has better support for bitmap images than complex SVG paths. PNGs also ensure consistent rendering across all devices - no font embedding issues, no weird scaling artifacts.

**Jordan:**  
So it's a quality decision.

**Alex:**  
Precisely. Now, once we have that PNG data, we send it through a secure bridge to the **Document Sandbox** - that's the environment that actually manipulates your Adobe Express document. That's where the equation gets inserted as a native graphic.

**Jordan:**  
And all of this happens in what, a second?

**Alex:**  
Usually under a second. The bottleneck is actually the network call to Gemini for OCR - that's the 5-10 second wait. But local LaTeX rendering? Near-instant.

---

## 🎬 SCENE 7: REAL-WORLD USE CASE
*[Screen: Jordan's actual presentation project]*

**Jordan:**  
Let me show you a real project I created with Stemvex. This is a presentation I made for my AP Physics class on Special Relativity.

*[Opens a polished Adobe Express presentation]*

**Jordan:**  
Slide 1: Title slide with E = mc² as the hero image.  
Slide 2: The Lorentz transformation equations - I used the Image Digitizer on my university textbook.  
Slide 3: A comparison of Newtonian vs. Relativistic momentum - I parsed this from a Wikipedia article using Text Parser.  
Slide 4: The full energy-momentum relation with a worked example.

**Alex:**  
How long did this take you?

**Jordan:**  
Total creation time? Maybe 45 minutes. That includes designing the slides, finding images, adding text...

**Alex:**  
And before Stemvex?

**Jordan:**  
Honestly? I probably would have spent 3-4 hours, and the equations would still look worse. I'd be fighting with PowerPoint's equation editor or dealing with low-res screenshots.

**Alex:**  
That's the power of unified workflow. Everything you need in one place.

---

## 🎬 SCENE 8: FUTURE VISION
*[Screen: Roadmap visualization]*

**Alex:**  
So Jordan, you've been using the current version. What features are you most excited about for the future?

**Jordan:**  
Ooh, good question. I saw the roadmap - handwriting recognition is huge. So many of my students take handwritten notes, and being able to scan those directly would be game-changing.

**Alex:**  
That's Phase 2: Advanced Features. We're leveraging Gemini's multimodal capabilities for that. What else?

**Jordan:**  
The template library! Pre-built equation sets for different subjects. Imagine: "High School Physics Pack" with all the standard formulas, or "Organic Chemistry Notation" for molecular structures.

**Alex:**  
We're calling those "LaTeX Libraries" - think of them like Adobe's existing template system, but for equations. You can share them with your team or classroom.

**Jordan:**  
Collaboration features too, right? I'd love to build a shared library with my department.

**Alex:**  
Yep! Cloud sync and team libraries are on the Phase 3 roadmap. And here's something wild - we're exploring **AI Equation Generation**.

**Jordan:**  
Wait, what does that mean?

**Alex:**  
Imagine typing in natural language: "Show me the chain rule for calculus" and Stemvex auto-generates the LaTeX and inserts it.

**Jordan:**  
That's... okay, that's incredible. So I could just describe what I want?

**Alex:**  
Exactly. "Create a 3x3 matrix with variable entries" or "Generate the quadratic formula with step-by-step solution." Gemini can handle that.

**Jordan:**  
This is going to make math education so much more accessible.

---

## 🎬 SCENE 9: WHO IS THIS FOR?
*[Screen: User persona graphics]*

**Alex:**  
Let's talk about who should be using Stemvex. Obviously educators like Jordan, but who else?

**Jordan:**  
Students, for sure. I have seniors working on research projects who need to create poster presentations. This is perfect for that.

**Alex:**  
Graduate students preparing thesis defenses - that's a huge use case. You might have 200+ equations to format.

**Jordan:**  
Technical content creators! I follow a few science YouTubers who would kill for this. They're currently paying editors or using clunky screen recording of LaTeX compilers.

**Alex:**  
Corporate R&D teams preparing technical reports. Anyone who needs to bridge the gap between technical rigor and visual appeal.

**Jordan:**  
The unifying thread is: if you work with complex notation and need it to look professional, Stemvex is for you.

**Alex:**  
And the beauty is - you don't need to be a LaTeX expert. The example library and OCR features mean you can get started even if you've never written a line of LaTeX in your life.

---

## 🎬 SCENE 10: PRICING & ACCESS
*[Screen: Pricing tiers visualization]*

**Jordan:**  
So Alex, let's talk accessibility. Is this going to be affordable for teachers? Because district budgets are... not great.

**Alex:**  
We hear you. Our plan is a freemium model:  
- **Free Tier**: 50 equations per month, basic OCR, access to the example library  
- **Pro Tier**: $9.99/month - unlimited equations, advanced OCR with higher accuracy, batch processing  
- **Team Tier**: $49.99/month - everything in Pro, plus shared libraries, priority support, and API access for custom integrations

**Jordan:**  
50 equations a month on free is actually pretty generous for casual users.

**Alex:**  
That's the goal. We want every student to be able to use this. And we're working on educational institution licenses - think university-wide access at a discounted rate.

**Jordan:**  
I'd push for my school to get that in a heartbeat.

**Alex:**  
We're also exploring grants and partnerships with non-profits focused on STEM education. This should be accessible to everyone.

---

## 🎬 SCENE 11: QUICK TIPS & TRICKS
*[Screen: Back to Stemvex interface]*

**Jordan:**  
Before we wrap up, Alex, any pro tips you haven't mentioned?

**Alex:**  
Oh, a few! First: **keyboard shortcuts**. You can press Ctrl+Enter to insert the current equation without clicking the button.

**Jordan:**  
Didn't know that!

**Alex:**  
Second: **Color customization**. See this color picker? You can change the equation color before inserting. Great for matching your design theme.

*[Demonstrates color picker]*

**Jordan:**  
Ooh, I need this for my school colors!

**Alex:**  
Third: **LaTeX validation**. If you write invalid syntax, we'll catch it before trying to render. Look -

*[Types `\frac{a}{b` - missing closing brace]*

**Jordan:**  
See the error message? "Mismatched curly braces."

**Alex:**  
Saves you from the frustration of "why isn't this working?" And finally: **batch export**. If you insert multiple equations, you can right-click in Adobe Express and export them all at once as a PNG pack.

**Jordan:**  
Super useful for creating equation reference sheets!

---

## 🎬 SCENE 12: COMPARISON TO ALTERNATIVES
*[Screen: Comparison table]*

**Alex:**  
Jordan, you've probably tried other solutions before. How does Stemvex compare?

**Jordan:**  
I used Mathpix for a while - great OCR, but it's a separate app. I'd still have to import images manually into Adobe Express.

**Alex:**  
Right, no integration.

**Jordan:**  
I tried LaTeX editors like Overleaf - fantastic for complex documents, but overkill for inserting a single equation. And the export process is tedious.

**Alex:**  
What about built-in equation editors, like PowerPoint's?

**Jordan:**  
*[groans]* Don't get me started. Limited functionality, clunky interface, and they always look... amateur? Like, you can tell it's from a equation editor.

**Alex:**  
Whereas Stemvex equations look like they came from a published textbook.

**Jordan:**  
Exactly. Professional-grade output with consumer-grade ease of use.

---

## 🎬 SCENE 13: LIVE Q&A ANTICIPATION
*[Screen: FAQ list]*

**Alex:**  
Alright, let's rapid-fire some questions we've gotten from beta testers.

**Jordan:**  
Hit me.

**Alex:**  
"Does this work offline?"

**Jordan:**  
LaTeX input? Yes. OCR? No, because it requires the Gemini API. But you can queue images and process them when you're back online.

**Alex:**  
"Can I use custom LaTeX packages?"

**Jordan:**  
Currently, we support KaTeX's standard library, which covers about 95% of use cases. Custom packages are on the roadmap.

**Alex:**  
"What image formats does OCR support?"

**Jordan:**  
PNG, JPG, JPEG, and WebP. Pretty much anything you can screenshot or photograph.

**Alex:**  
"Is my data secure?"

**Jordan:**  
Great question. Stemvex doesn't store your equations. API calls to Gemini are encrypted, and we recommend using your own API key for maximum privacy.

**Alex:**  
"Can I edit an equation after inserting it?"

**Jordan:**  
Not... yet. Once it's a PNG, you'd need to re-insert. But "equation history" is coming in Phase 1, which will let you quickly recall and modify previous equations.

---

## 🎬 SCENE 14: CALL TO ACTION
*[Screen: Stemvex landing page / GitHub repo]*

**Alex:**  
So, how can people get started today?

**Jordan:**  
If you're a developer or early adopter, the code is open-source on GitHub. Link in the description.

**Alex:**  
Clone the repo, run `npm install`, then `npm start`, and load it in Adobe Express Developer Mode. Full instructions in the README.

**Jordan:**  
If you're an educator or student and want to join the beta without setting up the dev environment, sign up on our waiting list. We're onboarding 100 new users per week.

**Alex:**  
And if you're an educational institution interested in a pilot program, reach out directly. We're offering free team licenses for the first 10 schools.

**Jordan:**  
Investors, partners, or just people who want to follow along - join our Discord community. We're sharing weekly updates and running live demos.

**Alex:**  
Link to everything is in the video description.

---

## 🎬 SCENE 15: CLOSING & THANK YOU
*[Screen: Stemvex logo with tagline]*

**Jordan:**  
Alex, thank you for building this. Seriously, as a teacher, tools like this remind me why I love educational technology.

**Alex:**  
That means everything, Jordan. This project started because we saw educators struggling and thought, "There has to be a better way."

**Jordan:**  
And there is. Stemvex is that better way.

**Alex:**  
To everyone watching: we built this for YOU. Whether you're teaching quantum mechanics, learning calculus, creating YouTube explainers, or publishing research - we want to empower your technical storytelling.

**Jordan:**  
Math is beautiful. Science is beautiful. Your presentations should be too.

**Alex:**  
If you found this demo useful, give us a thumbs up, drop a comment with what feature you're most excited about, and subscribe for updates as we roll out new features.

**Jordan:**  
Next video, I'm going to show you how I created an entire week's worth of lesson plans using Stemvex in under two hours.

**Alex:**  
Can't wait for that! Alright everyone, thanks for watching. Now go build something amazing.

**Jordan:**  
Built with love for technical storytellers. See you next time!

*[Screen: Fade to Stemvex logo]*  
*[Text overlay: "stemvex.app | @stemvex | Open Beta - Sign Up Now"]*

---

## 📝 PRODUCTION NOTES

### Camera Setup
- **2-person split screen** for Scenes 1-2, 8-15
- **Screen share dominant** for Scenes 3-7 (demo sections)
- **Picture-in-picture** during live demos (small webcam corner)

### Screen Recording Checklist
- [ ] Adobe Express with clean canvas
- [ ] Stemvex add-on loaded and ready
- [ ] Example textbook image prepared (high contrast, clear equations)
- [ ] Sample text document for parser demo
- [ ] Jordan's completed presentation example

### Post-Production Elements
- **Motion graphics**: Equation animations when they appear on canvas
- **Callout boxes**: Highlight key features (e.g., "Insert Equation" button)
- **Timer overlay**: Show time savings during comparisons
- **Chapter markers**: YouTube chapters for each demo section
- **Background music**: Subtle, modern, inspiring (think tech keynote)

### Key Timestamps (for YouTube description)
```
0:00 - Introduction & Problem Statement
1:30 - What is Stemvex?
2:15 - Demo 1: Direct LaTeX Input
4:00 - Demo 2: Image Digitizer (OCR)
6:00 - Demo 3: Text Parser
7:30 - Technical Deep Dive
8:45 - Real-World Use Case
10:00 - Future Roadmap
11:15 - Who Should Use This?
12:00 - Pricing & Access
12:45 - Tips & Tricks
13:30 - Comparison to Alternatives
14:15 - FAQ
15:00 - Call to Action & Closing
```

### B-Roll Suggestions
- Time-lapse of creating a full presentation
- Close-ups of equations rendering
- Classroom setting (if available)
- Screenshots of positive user testimonials/reviews

### Engagement Hooks
- **Opening hook**: "What if I told you that creating professional math equations in your designs could take 10 seconds instead of 10 minutes?"
- **Mid-roll hook**: "Wait until you see what the OCR can do - this blew my mind."
- **Closing hook**: "Stick around for the next video where we create a week of lesson plans in under 2 hours."

---

## 🎯 VIDEO GOALS

1. **Education**: Viewers understand what Stemvex does and why it's valuable
2. **Demonstration**: Clear, step-by-step walkthroughs of all core features
3. **Conversion**: Drive sign-ups for beta access or GitHub stars
4. **Community**: Establish credibility with educators and STEM creators
5. **Shareability**: Create moments that make viewers want to share with colleagues

**Target Length**: 15-17 minutes (YouTube sweet spot for educational tech content)

**Tone**: Professional but approachable, enthusiastic but not over-hyped, technical but accessible

---

*End of Demo Script*
