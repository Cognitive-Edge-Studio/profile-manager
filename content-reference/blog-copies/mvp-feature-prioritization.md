# MVP Feature Prioritization: Which Features Belong in Your First MVP?

**Article metadata**

| Field | Value |
| --- | --- |
| Slug | mvp-feature-prioritization |
| Main keyphrase | MVP feature prioritization |
| Related keyphrases | MVP feature prioritization framework, MVP feature list, how to prioritize MVP features |
| Meta title | MVP Feature Prioritization: What to Build First |
| Meta description | Learn how to choose MVP features, compare priorities, plan manual work, and use a worksheet to agree on your first release with a developer. |

> **At a glance**
>
> This guide explains MVP feature prioritization through a worked example and a worksheet. You'll learn how to assess requests, discuss dependencies with a developer, assign manual work, and decide what belongs in your first release.

MVP feature prioritization is deciding which features your first release needs, which can be handled another way, and which can wait. The starting point is the useful task a customer needs to finish.

Your list might contain a request form, a reporting dashboard, automatic messages, payments, and a mobile app. To decide which belong in the first release, start with the purpose of that release.

A minimum viable product, or MVP, helps you test an important assumption before investing further. So when deciding how to prioritize MVP features, ask what users must be able to do and what you need to learn from their use.

## Step-by-Step MVP Feature Prioritization

This MVP feature prioritization framework turns each proposed feature into a decision you can review with a developer. Work through the steps in order, recording an investigation when you need more information before committing to an approach.

### 1. Define the First Task and What You Need to Learn

Before choosing features, write down who the first version serves, what they need to do, and what counts as a useful result. Use that description to judge each request and explain why it belongs in the first release.

To help you apply these questions to your own product, we'll follow one example through the article. You'll see how to turn a customer task into feature decisions you can discuss with a developer. The example is an imaginary community workshop that lends tools to its members. It is a planning example, not a client project.

Suppose members currently contact a coordinator to ask about borrowing a tool. The proposed service lets them view the tools, request borrowing dates, and receive a confirmed or declined request. The coordinator checks availability and records when a tool is collected and returned.

For this example, the first trial serves existing members under the workshop's current lending rules. The software does not collect payments or deposits.

The question to explore could be whether members can submit enough information for the coordinator to resolve requests without repeated clarification. During the trial, the workshop would record incomplete requests, follow-up messages, and the help people need. Records from the current process could provide a useful comparison.

For this trial, the proposed service promises coordinator-reviewed requests. Members would be told when to expect a decision.

Write your own starting point in a few sentences:

- Who will use the first version?
- What do they do today?
- Where does their task start, and what result finishes it?
- What do you need to learn from their use?

Keep the learning question specific. Completing requests would tell the workshop something about the process. It would not establish that other workshops would pay for the software.

### 2. Find the Need Behind Each Feature Request

A request usually names a solution. Ask what the person needs to achieve before deciding to build it. The same need may have several workable solutions, with different costs, effort, and responsibilities.

The UK government's Government Digital Service (GDS) makes this distinction in its [guidance on understanding user needs](https://www.gov.uk/service-manual/user-research/start-by-learning-user-needs): describe the user's problem and ground it in research. That principle is useful when planning a small business product too.

For the workshop, the conversation might look like this:

| Requested feature | Possible underlying need | Question to explore |
| --- | --- | --- |
| Push notifications | Members need to know whether their request was accepted | Would a message through an existing channel reach them? |
| Live availability calendar | Members need a tool for particular dates | Can they wait for coordinator confirmation, or do they need an immediate answer? |
| Reports dashboard | The coordinator needs to see unresolved requests and outstanding tools | Would a simple working list provide the information? |

These are possible explanations to check with users.

Ask about the last time the problem happened. What was the person trying to do? What information was missing? How did they work around it?

Record the difference between an observation and a suggestion. A member asking for notifications tells you they requested notifications. You still need to understand what they are missing and which approach would help.

Group requests that address the same need before evaluating them. This lets you compare alternative approaches without treating each suggestion as a separate commitment.

### 3. Ask What Happens If You Leave a Feature Out

For each proposed item, describe the consequence of removing it. Connect the decision to the task, the people using the service, and what you need to learn. A feature may belong in the first release because it:

- Lets someone complete a necessary part of the task.
- Supports appropriate access, accurate information, or reliable operation.
- Provides evidence needed for the trial's learning question.

If none of those reasons applies, consider postponing it. If one does apply, check whether a smaller feature, an existing tool, or a manual process can meet the need.

#### MVP Feature List: An Example First Release

The following MVP feature list applies the inclusion test to the imaginary workshop. Each row records a delivery decision and its reason, so a developer can review the proposed scope and its assumptions.

| Item | Initial decision | Reason |
| --- | --- | --- |
| Tool information and a request form | Build now | Members need to identify a suitable tool and submit the required details. |
| A saved request and clear submission status | Build now | Members and staff need to know whether the request was received. |
| A coordinator list with request decisions and loan records | Build now | Staff need to manage the work and record collection and return. |
| Availability checks and messages to members | Handle manually | The coordinator may be able to use the current records and an existing communication channel. |
| A connection to the existing stock system | Investigate first | Access, record accuracy, and update behavior are unknown. |
| An instant availability calendar | Postpone conditionally | Coordinator review may be sufficient, provided members can accept the delay. |
| Automatic reminders and a reporting dashboard | Postpone | Manual follow-up and a simple operational list may cover the trial. |

These decisions depend on the service being offered. If the workshop needs a deposit before confirming a loan, that requirement changes the plan.

Also distinguish a reporting dashboard from the screen staff need to do their work. A coordinator who cannot find pending requests cannot run this service. The operational view needs to be included in the scope.

Agree on what correct behavior looks like. For this example:

- Members see only the request information they are allowed to access.
- Authorized staff can record decisions and loan status.
- A request marked as saved remains available when reopened.
- A failed submission clearly tells the member that the request has not been received.
- Retrying an action does not leave staff with confusing duplicate records.

These are starting points for a discussion with the developer. They need to determine how to implement and verify the behavior.

### 4. Check Dependencies and Unknowns With Your Developer

A dependency is something a feature needs before it can work. Recording the coordinator's decision depends on having a saved request, identifying the correct member, and controlling who can change the record. That supporting work can be essential even if members never see it.

Ask the developer to look at the complete task. Estimating a screen without its supporting behavior can leave important work out of the discussion.

Consider the proposed stock-system connection. A live availability display might need answers to questions such as:

- Can the software access the existing records?
- Do those records distinguish each tool clearly?
- How are collection, return, and unavailable tools recorded?
- How quickly do changes appear?
- What happens if two requests overlap or the connection fails?

You do not need to answer the engineering questions yourself. You need to make the uncertainty visible before treating the feature as agreed work.

An investigation could be recorded like this:

**Question:** Can the current stock records support the availability information the service needs?

**Owner:** The developer, working with the person who maintains those records.

**Evidence to return:** Available access, sample records, update limitations, unresolved problems, and implications for the build.

**Next decision:** Use a workable manual check, approve a connection with a reviewed scope, or change the proposed service.

Agree on the extent of that investigation before it begins. It should return information that helps you make a decision.

Ask for effort estimates that include relevant design, development, testing, setup, and continuing responsibilities. Keep the unknowns attached to the estimate. An untested connection should not receive a confident estimate merely to complete a spreadsheet.

If all the necessary work exceeds your available time or budget, revisit the audience, task, or approach. Removing a required safeguard or a prerequisite can leave you with a release that cannot do its job.

### 5. Give Manual Work an Owner and a Limit

Manual delivery creates operating work every time someone uses the service. Compare that continuing workload with the effort of building and maintaining automation before deciding what the trial can support.

For the workshop's manual availability checks and follow-up, agree:

- Who checks requests and who covers their absence.
- When members should expect a response.
- How staff avoid confirming conflicting loans.
- Where decisions and follow-up work are recorded.
- What signs would show that the workload is becoming unmanageable.

“Someone can email them” leaves these responsibilities unresolved.

Also check whether existing software already covers part of the task. You may be able to use the workshop's current messaging and records tools, provided access is appropriate and the process stays consistent. Compare that work with maintaining a new feature.

Keep the test aligned with the promise. Coordinator review can help test the usefulness of an online request process, but it cannot establish that an automated availability system works. If members need immediate confirmation, investigate that requirement before relying on manual review.

### 6. Complete a Feature Decision Worksheet

Use a short record for each substantial feature. Split a broad item when its parts serve different needs or have different priorities. Start the document with your first audience, complete task, and learning question. Then work through these fields:

| Question | What to record |
| --- | --- |
| What has been requested? | The proposed behavior in plain language. |
| Who needs what result? | The need behind the request and its place in the task. |
| What evidence do we have? | Observations, requests, existing records, or business rules. Mark assumptions clearly. |
| What happens without it? | The specific problem caused by leaving it out. |
| Is there another workable approach? | A smaller feature, existing tool, or manual process. |
| What does it depend on? | Required data, access, other features, or connected systems. |
| What effort and uncertainty are involved? | Developer input, including checks, setup, and continuing work. |
| What will we do? | Build now, use an existing tool, handle manually, investigate first, or postpone. |
| Who owns the next action? | The person responsible and any review or response expectations. |
| What could change the decision? | Evidence to gather and a point at which to review it. |

For example, a record for automatic reminders might say:

> **Need:** Staff need to follow up when tools have not been returned.
>
> **Current knowledge:** This is part of the imaginary workshop's lending process. We have no trial evidence yet showing how much follow-up the proposed service would create.
>
> **Alternative:** The coordinator checks outstanding loans and contacts members through the agreed channel.
>
> **Decision:** Postpone automatic reminders while assigning manual follow-up to the coordinator.
>
> **Dependency:** Any later reminder feature needs accurate return dates, loan status, and suitable contact details.
>
> **Reconsider when:** Missed returns persist despite the agreed process, or follow-up becomes more work than staff can manage.

After reviewing individual items, walk through the whole task again. Check that the included work forms a complete service and that required dependencies have been covered.

### 7. Choose a Method for Comparing the Remaining Options

A framework can help you compare the choices left after completing the worksheet. Choose one that fits the evidence you have and the decision you need to make, rather than applying several methods to the same list.

| Approach | Useful question | What you need first |
| --- | --- | --- |
| Value versus effort | Which workable option contributes more for the effort involved? | A specific outcome and developer input on effort. Easy work still needs a reason to belong. |
| MoSCoW | Which requirements are commitments for this release? | An agreed release boundary and a reason for each priority. |
| RICE | How do several opportunities compare using a consistent score? | Supported estimates of reach, impact, confidence, and effort. |

#### MoSCoW: Agree What Matters in This Release

The [Agile Business Consortium's MoSCoW guidance](https://www.agilebusiness.org/resource/what-is-moscow-prioritization/) defines four priority groups for an agreed delivery period. Use them to explain the importance of each requirement and set expectations about what the release will include:

- **Must have:** The release cannot deliver a viable outcome without it.
- **Should have:** Important, but the release remains workable without it.
- **Could have:** Useful, with less consequence if it is left out.
- **Won't have this time:** Explicitly outside the current release.

Use the consequences of omission recorded in your worksheet to assign each group. An acceptable workaround can change whether a particular implementation is a must-have.

Keep the distinction between priority and delivery approach. MoSCoW describes importance within a release. Your worksheet also records whether the need will be met through custom software, an existing tool, or manual work.

#### RICE: Use Scores When You Can Support the Inputs

RICE compares reach, impact, confidence, and effort. Reach concerns how many people or events an option affects within a defined period. Confidence reflects the support behind your estimates.

[Intercom's original explanation of RICE](https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers) recommends using real measurements where possible and including work across the team in effort. It also explains why dependencies can justify doing work outside score order.

If you cannot support the inputs yet, keep the assumptions visible and use a qualitative discussion while gathering evidence. Calculating a score does not supply the missing information.

### 8. Resolve Competing Requests Before Changing the Scope

Suppose the coordinator asks for a loan-extension screen while members ask to choose a collection time online. Both requests affect borrowing, but they solve different problems and need separate evidence.

For each request, identify who is being blocked, what happens now, and whether the problem affects the promised task. An occasional preference and a recurring inability to collect a tool deserve different attention.

Ask the developer about the consequences too. Extending a loan changes the expected return date. Offering collection times may require opening hours and limits on how many people staff can serve. Those rules need agreement before the screen can be estimated.

If both changes are necessary and do not fit, revisit the release scope, time, or budget. Choosing the easier screen alone does not resolve the other requirement.

When you accept a change, write down:

- What evidence or requirement changed.
- Why the addition belongs in this release.
- What supporting work it needs.
- Whether other work will be removed.
- How it affects the estimate and review date.
- Who approved the decision.

A new idea, a newly discovered requirement, and a fault need different responses. A problem that exposes another member's information or loses requests needs review immediately. A request for a different dashboard layout can be assessed against the current scope.

Agree on the change before the added work starts. This gives both you and the developer a clear record of the decision.

### 9. Give Postponed Features a Reason to Return

A postponed list is useful when it helps you make a later decision. Record what you would need to observe before spending more effort on each item. Avoid treating every entry as a promise for the next release.

For the workshop, record conditions such as these:

| Postponed feature | Evidence that could justify reconsidering it |
| --- | --- |
| Stock-system connection | Re-entering records causes recurring errors or excessive work, and investigation identifies a suitable connection. |
| Reporting dashboard | Staff have a specific recurring decision the operational list and simple trial records cannot support. |

These observations would start another scope discussion. They would not automatically approve development.

Review the reason too. If members struggle to choose the right tool, a live calendar may do little to help. The next improvement might be clearer tool information.

## Final Thoughts

A useful scope discussion starts with your completed worksheet and unresolved questions. Give the developer the sample records and access they need to assess those questions before you commit to the build.

Leave that discussion with one agreed version of the feature list and named owners for any outstanding checks.

## Frequently Asked Questions

When you turn the feature decisions into a development brief, you may still have questions about how to describe the work. These answers clarify feature counts and the need for accounts before you request an estimate.

### How Many Features Should a First MVP Include?

There is no fixed number that defines an MVP. A feature might mean a single button or a complete workflow, so two lists with the same number of entries can represent very different amounts of work.

Use specific descriptions when comparing scope. “Calendar” could mean a date field, a view of requested dates, or a system that checks availability and resolves conflicting bookings. Those are different commitments.

### Does Every MVP Need User Accounts?

Not every MVP needs a full registration and profile system. The decision depends on whether the task requires identifying a person, keeping a record for them, or controlling access to information and actions.

A public calculator that returns a result without storing personal information may not need accounts. A service showing members' private loan records needs an appropriate way to verify who can view or change them. Agree on that access approach with the developer before the trial.
