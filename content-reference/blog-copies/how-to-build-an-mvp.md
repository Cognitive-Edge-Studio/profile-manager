# How to Build an MVP With One Developer: Plan Your First Useful Version

**Article metadata**

| Field | Value |
| --- | --- |
| Slug | `how-to-build-an-mvp` |
| Main keyphrase | how to build an MVP |
| Related keyphrases | how to build a minimum viable product, MVP development process |
| Meta title | How to Build an MVP With One Developer: A Practical Guide |
| Meta description | Learn how to build an MVP with one developer, define the first useful release, review progress, test with users, and decide what to improve after launch. |

> **At a glance**
>
> This guide explains how to build an MVP with a developer, from choosing the first useful task to learning from real users. It covers scope, responsibilities, progress reviews, testing, and launch. You'll also find a short planning worksheet to help you agree on what the first version needs to do.

You have an idea for a product. Each conversation adds something to it: a dashboard, reminders, payments, perhaps a mobile app. Before long, the feature list is easier to describe than the problem the product should solve.

Before paying for the build, bring the plan back to the first person who will use it. What do they need to finish, and what would make the result useful enough to try?

One developer may be able to build that first version. You still need to make product decisions, provide information, find suitable users, and agree on how you'll judge the result.

## What is a minimum viable product (MVP)?

A minimum viable product, or MVP, is a first version or experiment that helps you test an important assumption about your customers. It gives you a way to see whether people find a result useful before you invest in more of the product. Depending on the question, the first test may involve a service you deliver manually.

This guide focuses on a usable software MVP. People should be able to complete the task you've promised, while you learn whether the result is valuable. The word minimum describes the scope you choose. Accurate records, appropriate access, and a working path to the result are still part of the job.

## How to build an MVP

To build a minimum viable product, choose a customer problem, define a useful task, and decide what the first release needs to test. Then agree how you and the developer will deliver it, check it, and put it into use. The MVP development process below takes you through those decisions and the review that follows the first release.

### 1. Choose one customer problem and one useful result

Start with a specific group of people and a situation they already face. Ask how they handle it today, where the difficulty occurs, and what would make them change their approach. Their existing option might be email, a spreadsheet, another product, or leaving the problem unresolved.

We'll use an imaginary quote approval service throughout this guide. It is a planning example, not a client project.

Suppose a small repair business sends quotes as attachments and follows up by phone. The proposed service lets a customer open a quote on their phone, review the work and price, and approve or decline it. Staff can see the response and arrange the next step.

The useful task ends with a recorded decision. A customer opening a link is only part of that task.

The first question could be whether customers will respond this way with an amount of help the business can manage. That gives you a reason to build and something to observe. Whether repair businesses will pay for the service is another question. Customer use alone won't answer it.

### 2. Choose the MVP scope and essential features

Walk through the task from beginning to end. For the quote service, staff prepare a quote, send it to the intended customer, and receive a recorded response. Sketch the few screens and decisions needed along that path.

Ask whether each proposed feature is necessary to complete the task, run the trial responsibly, or collect the evidence you need. If its purpose is unclear, leave it for a later decision.

| Build for the first release | Handle manually during the trial | Leave for later |
| --- | --- | --- |
| Staff can enter and check quote details | Staff prepare the quote and send its link | Accounting and stock-system connections |
| The intended customer can review and respond | Staff answer questions by phone or email | In-app chat and automatic reminders |
| Staff can see the saved response | Staff arrange work after approval | Scheduling and online payments |

Appropriate access and accurate records support the whole task. Customers must see the right quote, and a failed save must not look like a recorded approval. Agree what happens if a quote changes or is withdrawn.

Discuss where people will use the product. A browser-based version may suit this example if customers can complete the task on their phones. A product that depends on particular device capabilities may need a different approach.

Also consider whether existing software or a no-code tool can support the task before choosing a custom build. Check how well that approach fits the required workflow and who needs access to the information.

Manual work also needs an owner. Decide who sends links, handles questions, and follows up. Check how many quotes that person can reasonably manage during the trial.

### 3. Check whether one developer can deliver this scope

Assess the work you have described against the developer's skills and available time. The title full-stack developer usually covers the screens people use and the software and data behind them. It doesn't establish that someone also handles every design, research, security, and support responsibility.

For the quote service, discuss who will design the screens, check access to quotes, prepare the live system, and respond to problems. Some tasks may fit the developer's experience. Others may need a designer or specialist reviewer.

A deadline requiring several pieces of work at the same time, unfamiliar integrations, or demanding security requirements can change the staffing decision. One task can also involve several roles, such as staff and customers, with different permissions.

Your responsibilities matter too. Someone on the business side needs to supply realistic examples, make decisions, review progress, and recruit early users. Agree who covers problems when the developer is unavailable.

### 4. Plan the MVP development process in reviewable stages

Turn the scope into stages with a result you can examine. Y Combinator's [advice on planning an MVP](https://www.ycombinator.com/blog/startup-school-week-2-recap-michael-seibel-adora-cheung-and-ilya-volodarsky/) includes writing down what you plan to build. A written scope gives you a reference when new ideas arrive.

For the illustrative quote service, the stages could be:

1. **Agree the first release.** Record the task, sample quote, included behavior, exclusions, access needs, and learning question. Investigate any unknown that could block the task.
2. **Try a complete working version.** On a private test site, follow a quote from staff entry through the customer's response to the staff record. Review the agreed completion checks.
3. **Prepare and run a limited trial.** Finish the required checks, arrange support, invite suitable users, and collect the evidence for your next decision.

Agree target dates, review points, responsibilities, and spending limits for those stages. A delay in sample data, account access, or a business decision can affect the next stage, so record those dependencies.

When a new feature is requested, ask what it changes. You may exchange it for other work, approve additional time and cost, or leave it for later. Record the decision before the added build begins.

Keep the estimate tied to the work. Design, permissions, connected services, existing data, testing, and launch can affect it. Separate the build commitment from hosting, outside services, manual operations, support, and later revisions.

### 5. Test the core task and review working software

Ask for a private test link as working parts become available. Use it to follow the customer's task rather than judging progress only by screenshots.

For the quote service, agree checks such as these:

- The intended customer sees the correct work description and amount.
- Another customer cannot access that quote.
- A response remains saved after the page is reopened and appears for staff.
- A failed save produces a useful message without showing a successful response.
- A changed or withdrawn quote follows the agreed rules.
- The task works on the phones and browsers intended users will have.

Your review and the developer's technical checks have different roles. Ask what they have tested, what remains unresolved, and whether specialist verification is needed. Trying the customer task yourself cannot establish everything about the software underneath.

Also let suitable users attempt the task with little guidance. Watch where they hesitate or misunderstand what will happen. If you explain every action, you may miss a problem with the experience.

Keep three questions separate: does the software behave as agreed, can users complete the task, and do they value the result? A successful technical test answers only part of what you need to know.

### 6. Prepare a small launch you can support

Identify the first users before development finishes. For the quote service, recruit a small repair business willing to try the process with customers who have actual quotes to review. Someone with no current quote has no reason to complete this task.

Agree what the participants will receive, who will answer questions, and how staff will handle the manual work. Explain any limits that affect their use of the service.

Before inviting customers, confirm that the live version passes the agreed checks. Decide who approves the release, who watches for problems, and how to pause or recover if something goes wrong. Check the access, instructions, and backup arrangements needed to operate it, along with ongoing bills and support responsibilities.

Prepare the measurement too. Agree how you'll record quotes sent, customer responses, errors, and requests for help. Keep records focused on the trial's question and discuss what customer information needs to be collected.

### 7. Use the first release to decide what to do next

Choose your measures before the trial begins. The Government Digital Service's [guidance on setting performance measures](https://www.gov.uk/service-manual/measuring-success/how-to-set-performance-metrics-for-your-service) connects measures to a service's purpose and recommends combining them with user research. That principle is useful for a small business trial too.

For the quote service, record how many customers received a quote, how many responded through the service, where they needed help, and how much staff effort was involved. An opened link can help explain what happened, but it doesn't establish that the customer completed the task.

Review the evidence over a period that covers normal quote activity. Compare it with the existing process where you have useful records. A small trial can inform a decision without proving that every difference was caused by the software.

Speak with people who used it and those who stopped. If customers want to respond online but struggle with one screen, improve that step. If they see little benefit over a phone call, revisit the approach before adding features. If too few real quotes reached customers, the evidence may be inconclusive.

Agree the next revision and its scope. You might improve the task, investigate willingness to pay, run a better trial, or stop. More features need a reason grounded in what you learned.

### 8. Write down your first-version plan

Bring the decisions together before committing to the main build. You can use this short worksheet with your developer.

| Question | What to record |
| --- | --- |
| Who will use the first version? | A specific group and the situation in which they need it |
| What task must they complete? | The starting point, action, and useful result |
| Why would they change their current approach? | The improvement you expect and the assumption you need to test |
| What will the release include? | Essential behavior, intended platform, checks, exclusions, and manual work |
| Who will do the work? | Developer responsibilities, business responsibilities, and any specialist help |
| How will delivery be reviewed? | Stages, completion checks, dependencies, dates, and spending limits |
| Who will use it first? | Suitable participants and the person responsible for support |
| What happens after the trial? | Measures, a review point, and the decisions the evidence should inform |

## Final thoughts

A useful first release gives customers a task they can finish and gives you evidence for the next decision. Its scope should be small enough to manage while covering what people need to reach that result.

Before you commit, write down the task, the work included, who handles it, and what you need to learn. Then agree a first stage you can review with the developer.

If you'd like to discuss your MVP, bring the customer problem, what people do today, and the first useful result you have in mind. Those details give us a concrete starting point for a conversation about the build.

## Frequently asked questions

### How long does it take to build an MVP?

Ask for a schedule against the agreed first release, with time for investigation, development, checks, and your reviews. Make clear which date means the software is ready for a trial and which marks the review of that trial. A product used for occasional tasks may need a longer observation period even after the build is complete. If a fixed date matters, explain why and ask what useful scope can fit it before committing.

### Can I build an MVP without hiring developers?

Yes, for some projects. If existing software or no-code tools cover the task, you may be able to set up and run the first version yourself. You still need to check the workflow, customer access, and saved data, and handle support. If essential behavior is beyond what you can configure and verify, get technical help before putting it into use.

### What makes a successful MVP development process?

A useful process connects the build to a question you need to answer. Agree on the customer task, review working software, check that people can use it, and collect evidence from a real trial. Finish with a decision about what to improve, investigate, or stop. Completing the planned features tells you the build is finished, but you still need to learn whether customers value the result.

### What mistakes should I avoid when building an MVP?

Avoid starting with a growing feature list before you have a clear customer task. Other mistakes include reviewing only screenshots, leaving manual work and support without an owner, and launching without a way to observe real use. Agree on the task, completion checks, responsibilities, and learning question before the main build. These give you a reference when requests or problems arise.
