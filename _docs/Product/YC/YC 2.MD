
# YC Application Questions (Winter 2026)

## Founders

### Question: Who writes code, or does other technical work on your product? Was any of it done by a non-founder? Please explain.
**Answer:** As the sole founder, I have been responsible for all technical work, from high-level architecture to hands-on implementation. My background is as a technical product manager, but for AGIPO, I've functioned as the founding engineer.

This has involved:
-   **Architectural Design:** I designed the core platform architecture around our fundamental "First Principle" that all knowledge work can be deconstructed into Input-Process-Output (IPO) nodes. This required deep research into creating a system that is both deterministic enough for reliable AI-driven code generation and intuitive enough for non-technical users.
-   **Execution Engine:** I engineered the client-side execution environment, investigating methods to compile and transpile code within the browser. This allows users to run complex Node.js workflows securely and without any server setup, a key technical differentiator.
-   **AI Integration:** I researched and selected our core AI agent frameworks, prioritizing modularity to ensure our system can easily integrate with various models and technologies as the AI landscape evolves. This included building the logic for how agents are assigned tools and how they manage memory and state.
-   **Infrastructure & Deployment:** I set up our hosting, deployment, and scaling strategy for all necessary serverless functions, ensuring the infrastructure can support our vision for a highly interactive, real-time platform.

Every technical decision has been made through the lens of building a scalable, flexible, and powerful platform that abstracts the complexity of code without sacrificing its power.

### Question: Are you looking for a cofounder?
**Answer:** Yes, I am actively seeking the right co-founder to join this journey. While I possess the technical depth to architect and build the initial product, I believe AGIPO's ambitious vision requires a dedicated technical leader who can own the codebase and scale the engineering organization long-term. This would free me to focus on product strategy, go-to-market, and sales—areas where I can provide the most leverage.

I have found it relatively easy to attract interest from potential technical partners, but I've been deliberate in my search. The ideal co-founder is someone I can "talk shop" with at a deep architectural level, who intuitively grasps the long-term vision, and who I genuinely enjoy collaborating with. I am not just looking for a pair of hands; I'm looking for a true partner.

Part of my reasoning for applying to YC is to gain access to a network and a framework that can help me identify and partner with the right person. I believe that building the right founding team is critical, and I want to get it right.

## Founder Video

### Question: Please record a one minute video introducing the founder(s).
**Answer:** (Script)

"Hi, I'm Jacobzen, the founder of AGIPO.

By trade, I'm a technical product manager with deep expertise in building and scaling multi-sided marketplaces.

At my last company, I led a product that scaled from zero to over $130 million in annual recurring revenue. Before that, I was part of the foundational team for a B2B marketplace that generated over $1 billion in gross market value in its first year alone.

I know how to build platforms that connect distinct user groups and create massive value. And that's exactly what we're doing with AGIPO.

We're building the marketplace for AI agents—making it simple for anyone to create, share, and deploy powerful workflows. My experience isn't just relevant to this problem; it's the unfair advantage that will allow us to win. I understand the dynamics of supply and demand in a digital ecosystem better than anyone.

I'm building AGIPO because I believe the future of work is collaborative, composable, and powered by AI that works for *you*. Thank you."

## Company

### Question: Company name*
**Answer:** AGIPO

### Question: Describe what your company does in 50 characters or less.*
**Answer:** A platform to hire, manage, and create AI agents.

### Question: Company URL, if any
**Answer:** AGIPO.app

### Question: If you have a demo, attach it below. (Anything that shows us how the product works. Please limit to 3 minutes or 100 MB.)
**Answer:** We have a working prototype and a clear vision for the demo video. The demo will tell the story of a user solving a real-world problem, showcasing the platform's core features in a compelling narrative.

**Demo Story:** Meet Jane, a product manager who spends hours every week manually summarizing user feedback from Intercom and posting it to Slack. With AGIPO, she automates this entire workflow in minutes.

**Demo Script & Scenes:**

| Scene # | Scene Description | Action on Screen | Talk Track (Voiceover) |
| :--- | :--- | :--- | :--- |
| 1 | **The Problem & The Hook** | A quick shot of a Kanban board-style view showing several "Agents" with icons. The cursor highlights an agent named "User Feedback Summarizer." | "This is AGIPO, a platform to hire, manage, and create your own personal AI workforce. Let's see how easy it is to build a new tool for one of our agents." |
| 2 | **Creating a New Tool** | The user clicks "Create Tool." A chat interface appears. The user types a prompt: "Create a tool that takes a list of Intercom conversations, summarizes them, and posts the summary to a Slack channel." | "Instead of wrestling with pre-built nodes, you just describe what you want to do in plain English. AGIPO's AI translates your request into a workflow." |
| 3 | **The IPO Canvas** | The chat interface is replaced by a visual canvas. Three connected nodes appear: `Input (Intercom)`, `Process (Summarize)`, and `Output (Slack)`. The code for each node is visible and clean. | "Our core innovation is the IPO model: Input, Process, Output. AGIPO automatically generates the code for each step. This isn't a black box; it's clean, readable code that you own and can understand." |
| 4 | **Configuration & Testing** | The user clicks on the `Input` node. A simple form appears to connect to Intercom via OAuth and specify the data to pull. The user clicks a "Run Test" button. | "You connect your accounts with a few clicks. The AI has already generated the input and output schemas. We can instantly test the tool to see it in action." |
| 5 | **Agent Interaction** | The screen shows a chat window with the "User Feedback Summarizer" agent. The user types: "@User Feedback Summarizer, run the new Intercom summary." The agent responds with the summary and a "Posted to Slack" confirmation. | "Once the tool is assigned to an agent, you can trigger it directly through chat, just like delegating to a team member. The agent has memory and can handle complex tasks." |
| 6 | **The Marketplace** | The view changes to a vibrant marketplace grid, showing various agents created by other users (e.g., "Meeting Transcriber," "Personal CRM Assistant"). Jane's "Intercom Summarizer" is now visible. | "And here's the most powerful part: the marketplace. Any tool you create can be shared or sold. We're not just building a workflow tool; we're building an economy for AI-driven work." |
| 7 | **Closing Vision** | The screen returns to the agent Kanban board, now with more agents, showing a thriving ecosystem. | "With AGIPO, you're not just automating tasks—you're building, managing, and scaling your own digital workforce. This is the future of productivity." |

This structure will allow us to demonstrate the entire lifecycle from creation to monetization in a concise and powerful way.

### Question: Please provide a link to the product, if any.
**Answer:** AGIPO.app

### Question: If login credentials are required for the link above, enter them here.
**Answer:**

### Question: What is your company going to make? Please describe your product and what it does or will do.
**Answer:** AGIPO is a platform for building, managing, and scaling a personalized AI workforce. We are moving beyond simple, rigid automation to a future where any professional can create powerful, custom AI agents that think and work like they do.

**The Fundamental Problem with Workflow Automation**

Current workflow automation tools like Zapier or N8N force users to conform to a predefined library of "nodes" and "triggers." This creates two major problems:
1.  **It’s Restrictive:** If a specific node for your use case doesn't exist, you're stuck. Users have to contort their natural way of thinking to fit the tool's limitations.
2.  **It’s Not an Economy:** The value created is locked in a single user's account. Sharing, selling, or collaborating on complex workflows is an afterthought, not a core feature.

This fundamentally limits the potential of automation. We believe that 90% of white-collar work is data transformation, but the tools to automate it are still stuck in a "no-code" paradigm that sacrifices power for simplicity.

**AGIPO: A New, First-Principles Approach**

AGIPO is built on a new foundation. We enable users to create workflows from scratch using natural language, which our AI translates into clean, deterministic, and powerful code. Our core belief is that every job is composed of workflows, and every workflow can be deconstructed into a universal pattern: **Input -> Process -> Output (IPO)**.

This IPO model is the simple, yet powerful, interface that allows anyone to become a builder. Instead of being limited by a vendor's node library, you can create the exact tool you need, just by describing it.

**What AGIPO Does:**

AGIPO is a multi-faceted platform designed to be the central hub for your AI-powered work:

1.  **AI-Powered Workflow Generation:** Users describe a task in our chat interface (e.g., "Summarize my unread emails and create a todo list"). AGIPO's AI uses the IPO model to generate a complete, functional workflow with underlying JavaScript/TypeScript code. This is a **code-first principle**; we provide the power of code without the steep learning curve.

2.  **Agent Management & Humanization:** Workflows are assigned to "Agents," which are humanized digital workers. You can chat with your agents, delegate tasks, and monitor their work on a Kanban-style board. Agents have memory and a history of all their runs, which serves as a basis for feedback, iteration, and improvement, just like managing a human employee.

3.  **A Thriving Marketplace:** The marketplace is the heart of AGIPO. Any tool or agent you create can be published for others to hire or purchase. This creates a powerful network effect where the platform's value grows with every new user and creation. We are building an economy for AI work, not just a tool.

4.  **Integrated Data Layer:** To solve the problem of data fragmentation, AGIPO includes a flexible, Google Sheets-like data store as a first-class citizen. This allows multiple agents to seamlessly and safely collaborate on the same data sources, creating a "single source of truth" for your automated work.

5.  **Proactive, Context-Aware Assistance:** The long-term vision is for AGIPO to become a proactive partner. By connecting data sources (email, calendar, socials), the platform will gain context to proactively suggest workflows. Eventually, it will be able to observe on-screen activity and automatically draft automations for your repetitive tasks, asking, "I've noticed you do this every day. Would you like me to create an agent for it?"

In essence, AGIPO is not just another automation tool. It is the operating system for the 10x augmented worker, providing the infrastructure to codify your unique knowledge, scale your impact, and participate in the emerging economy of AI-driven labor.

### Question: Where do you live now, and where would the company be based after YC? (We're looking at City A, Country A, City B, Country B)
**Answer:** I currently live in L.A., but I would be looking at living in either New York or San Francisco.

### Question: Explain your decision regarding location.
**Answer:** My ultimate commitment is to do whatever is best for the product's success. Given that AGIPO is geared towards a variety of white-collar workers, I believe New York is a better location due to my existing network and its strength for networking and discovery beyond just the SaaS sector. This also helps to get out of a bubble, as I envision the product being useful for both white-collar workers and general consumers for managing their lives and making agents accessible.

## Progress

### Question: How far along are you?
**Answer:** I am pretty early into this. I built a prototype two months ago, and then completely redid everything last week after receiving extensive feedback from investors and others at TechCrunch Disrupt. This most recent iteration is very new.

### Question: How long have each of you been working on this? How much of that has been full time? Please explain.
**Answer:** I left my job in January of 2025 to pursue and learn more about this space, and to learn how to code. This is a product I've wanted to build for a very long time.

### Question: What tech stack are you using, or planning to use, to build this product? (Include AI models and AI coding tools you use.)
**Answer:** Our current tech stack includes: Supabase for database tables, Next.js for the main application, Zustand for state management, a React Native front-end for mobile (currently in beta), Vercel for deployment, and the AI SDK for AI model integration. The UI elements are built with ChatCN.

### Question: Are people using your product?
**Answer:** Yes, I have a few beta testers.

### Question: How many active users or customers do you have? How many are paying you? Who is paying you the most, and how much do they pay you?
**Answer:** I have a few beta testers, and none of them are currently paying. I also have a small pipeline of people who have expressed strong interest in testing the product once it's out of beta.

### Question: Do you have revenue?
**Answer:** No, not yet.

### Question: If you are applying with the same idea as a previous batch, did anything change? If you applied with a different idea, why did you pivot and what did you learn from the last idea?
**Answer:** I have not applied with the same idea in a previous batch.

### Question: If you have already participated or committed to participate in an incubator, "accelerator" or "pre-accelerator" program, please tell us about it.
**Answer:** I have not participated in or committed to any incubator, accelerator, or pre-accelerator programs.

## Idea

### Question: Why did you pick this idea to work on? Do you have domain expertise in this area? How do you know people need what you're making?
**Answer:** This idea is the culmination of my entire career. I have deep domain expertise in designing, building, and scaling complex, multi-sided marketplaces—a skill set that is directly applicable to the economy we're building with AGIPO.

My journey to this idea came from a first-principles analysis of the modern workplace. I observed two key truths:
1.  **Universal Problem:** Across every industry, I saw talented people bogged down by repetitive tasks that were just unique enough to evade simple automation. The existing tools were too rigid.
2.  **Marketplace Dynamics:** I know from experience that the most powerful platforms are not just tools, but economies. They create value by connecting supply (creators) with demand (consumers) in a seamless way.

I knew people needed this because I kept hearing the same stories from both sides. I spoke with brilliant creators trying to monetize their automation skills who were frustrated by the friction of selling their N8N or Zapier workflows. They were hacking together solutions with courses and consulting gigs because the platforms themselves offered no native way to sell their expertise.

On the other side, I spoke to potential buyers, like a venture capitalist who had spent hundreds of dollars on courses and pre-made workflows, only to find them impossible to integrate into her daily life. The demand for personalized automation is immense, but the activation energy required is far too high.

AGIPO was born from these insights. It’s not just about building better automation; it's about building a liquid marketplace for it. My expertise isn't just in a single technology; it's in understanding the fundamental mechanics of how to build the two-sided network that will allow this new economy of AI-driven work to flourish. I am building AGIPO because I am uniquely positioned to see both the technical path and the market-making strategy required to win.

### Question: Who are your competitors? What do you understand about your business that they don't?
**Answer:** Our primary competitors are the established workflow automation platforms, mainly **N8N** and **Zapier**. However, we believe they are operating on a flawed paradigm.

Here is what we understand about this business that they don't:

1.  **They see the marketplace as a feature; we see it as the entire business.** For our competitors, the marketplace is an add-on, an afterthought to their core tool. This is a critical misunderstanding of the opportunity. A tool has users; an economy has a GDP. We are building an economy from day one. Our entire platform is designed around the principles of discovery, monetization, and collaboration, which is our key strategic moat and something my background in scaling marketplaces gives me a unique insight into.

2.  **They think in terms of rigid "nodes"; we think in terms of fluid, human-centric "agents."** Competitors force users to contort their thinking to fit a static library of nodes. This is fundamentally backward. Our "Workflow Extension Principle" dictates that the tool should be an encapsulation of how the user naturally thinks. AGIPO's agents are stateful, conversational, and iterative. They have memory and can be trained, making them feel like true digital colleagues, not just stateless automation scripts. This focus on "resonance over perfection"—creating an AI that mirrors the user's own style—is a deeper level of personalization that others are missing.

3.  **They are "no-code"; we are "code-first, abstracted."** The "no-code" model fundamentally limits power and flexibility. AGIPO is a code assistant that generates real, readable JavaScript/TypeScript. We use AI to abstract the complexity of programming, not to eliminate its power. This means our users have infinite flexibility, access to the entire npm ecosystem via our client-side execution engine, and are never constrained by the limitations of a visual-only builder. We are giving non-technical users the full power of programming in a way that our competitors cannot.

### Question: How do or will you make money? How much could you make?
**Answer:** We envision several potential business models. Given AGIPO is a multi-sided marketplace, users can create and buy agents, and businesses can submit RFPs (similar to Fiverr). The most straightforward approach is a credit-based system, charging per run, with potentially higher costs for more expensive API calls, or an upcharge on API costs. Alternatively, for workflow creators, they could price their workflows, and we would take a commission. This charges for perceived value rather than just runs. I've observed that people building automations for others using tools like N8N often charge thousands of dollars, far exceeding typical API costs, indicating significant value capture potential.

### Question: Which category best applies to your company?
**Answer:** AI agent, SaaS, Marketplace.

### Question: If you had any other ideas you considered applying with, please list them. One may be something we've been waiting for. Often when we fund people it's to do something they list here and not in the main application.
**Answer:** Yes, one other idea is an app called ENNA (E-N-N-A), a consumer-facing application designed for users to brain dump everything, which is then automatically organized into predefined categories. The goal is to easily categorize people's thoughts, feelings, and actions.

## Equity

### Question: Have you formed ANY legal entity yet? (This can be in the US, or your home country or another country)
**Answer:** No.

### Question: If you have not formed the company yet, describe the planned equity ownership breakdown among the founders, employees and any other proposed stockholders. If there are multiple founders, be sure to give the proposed equity ownership of each founder and founder title (e.g., CEO).
**Answer:** As the sole founder currently, the ownership would be entirely mine. With a co-founder, we would determine an equitable split.

### Question: Have you taken any investment yet?
**Answer:** No.

### Question: Are you currently fundraising?
**Answer:** Yes, I started speaking to investors at TechCrunch Disrupt last week. Many have requested to see the MVP, and I am actively engaging with them.

## Curious

### Question: What convinced you to apply to Y Combinator? Did someone encourage you to apply? Have you been to any YC events?
**Answer:** I believe Y Combinator can provide the crucial initial step forward for AGIPO. My experience as a product manager has equipped me to lead teams and structure projects, but I need assistance with the very early stages of development (the "zero to point one"). I learn best when surrounded by people pursuing similar goals, and YC offers that environment. Many investors I spoke to at TechCrunch Disrupt encouraged me to apply. I have not yet attended any YC events.

### Question: How did you hear about Y Combinator?
**Answer:** I've been interested in entrepreneurship since high school and have been following Y Combinator ever since, likely discovering it via YouTube or similar platforms. I don't recall the exact moment I heard about it.

## Batch Preference

### Question: What batch do you want to apply for?
**Answer:** Winter 2026
