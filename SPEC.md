# Archer product specification

Archer is a freelance marketplace where clients find independent talent, agree on project work, and collaborate through delivery.

This document defines product behavior and feature scope. It is intentionally changeable as product decisions evolve. Engineering boundaries and implementation rules live in `AGENTS.md`; setup and run instructions live in the package READMEs.

## Product goals

- Make it easy for clients to publish clear project briefs.
- Help freelancers discover relevant work and submit thoughtful proposals.
- Give both sides a shared project workspace after a proposal is accepted.
- Keep project status, milestones, messages, and important activity visible in one place.
- Support USD and MMK without introducing payment processing yet.

## Users and roles

### Client

A client can create a profile, publish jobs, review proposals, award a project, manage milestones, communicate with the freelancer, and review completed work.

### Freelancer

A freelancer can create a profile, browse jobs, submit proposals, track proposal decisions, participate in awarded projects, manage milestones, communicate with clients, and review completed work.

### Admin-ready role

The product should reserve an admin role for future moderation, account suspension, dispute handling, and audit review. Admin UI is not required for the first MVP.

## MVP feature scope

### 1. Account and profile

- Register and sign in with email and password.
- Choose a client or freelancer role during onboarding.
- Sign out and refresh an authenticated session.
- View and update basic profile information.
- Support profile headline, bio, location, avatar, languages, skills, and portfolio as the profile experience grows.

### 2. Jobs

Clients can:

- Create a job draft.
- Add title, description, category, skills, budget, currency, and optional target deadline.
- Publish, update, close, or cancel a job.
- View proposals received for a job.

Freelancers can:

- Browse published jobs.
- Search by title or description.
- Filter by currency and later by category, skills, and budget.
- Open a complete job brief before deciding whether to propose.

Job lifecycle:

`DRAFT → PUBLISHED → IN_PROGRESS → COMPLETED`

Jobs may also become `CLOSED` or `CANCELLED`.

### 3. Proposals

Freelancers can submit one proposal per job containing:

- Cover letter.
- Bid amount and currency.
- Estimated delivery time.

Freelancers can view proposal status and withdraw a proposal while it is still submitted.

Clients can:

- Receive a notification when a proposal is submitted.
- Open the proposal request from the notification.
- Review the freelancer, cover letter, bid, currency, and delivery estimate.
- Accept or reject the proposal.

Proposal lifecycle:

`SUBMITTED → ACCEPTED`

Other terminal states are `REJECTED` and `WITHDRAWN`.

Accepting a proposal must create a project snapshot using the agreed proposal terms. Other submitted proposals for the same job should no longer be actionable.

### 4. Project workspace

An accepted proposal creates a project for the client and freelancer.

The workspace includes:

- Job and agreed proposal context.
- Agreed amount and currency.
- Project status.
- Target deadline.
- Milestones.
- Project activity and notifications.
- A project-scoped conversation.

Project lifecycle:

`NOT_STARTED → ACTIVE → PAUSED → COMPLETED`

Projects may also become `CANCELLED`.

Both project participants can view the workspace. The API must enforce this participant boundary for every project, milestone, and message operation.

### 5. Milestones

Participants can create milestones containing:

- Title.
- Description.
- Amount and currency.
- Due date.
- Status.

Milestone lifecycle:

`PENDING → IN_PROGRESS → COMPLETED`

Milestones may also become `CANCELLED`.

Milestone creation and important status changes should notify the other project participant.

### 6. Messaging

- Messaging is project-scoped in the MVP.
- Only the project client and freelancer can read or send messages.
- Messages support plain text, timestamps, sender identity, and read state.
- New messages create a notification for the other participant.
- Rich text, attachments, presence, and real-time transport can be added later.

### 7. Notifications

Users can view unread and recent notifications.

MVP notification events include:

- New proposal received.
- Proposal accepted.
- Proposal rejected.
- Project status changed.
- Milestone created.
- New project message.

Clicking a notification should open the relevant proposal or project workspace. Users can mark one notification or all notifications as read.

### 8. Reviews

After a project is completed:

- The client can review the freelancer.
- The freelancer can review the client.
- A review contains a 1–5 rating and optional written feedback.
- Each participant can submit one review per project.
- Published reviews should not be freely edited.

Reviews are part of the MVP product scope, but may follow the initial project workspace release.

## Currency and money behavior

- Supported currencies are `USD` and `MMK`.
- Every job, proposal, project, and milestone amount includes its currency.
- USD is represented in cents internally.
- MMK is represented in whole kyat internally.
- The product does not automatically convert between currencies.
- The UI must display an unambiguous currency code or symbol with every amount.
- No MVP screen may imply that money has been paid, escrowed, or withdrawn.

## MVP exclusions

The following are intentionally excluded until explicitly added to this specification:

- Payment providers, escrow, wallets, payouts, and withdrawals.
- Dispute resolution and refunds.
- Real-time video or audio calls.
- Advanced matching or recommendations.
- Enterprise organizations and team accounts.
- File attachments and portfolio file storage.
- Full admin dashboard.

## Product acceptance criteria

The MVP is functionally coherent when:

1. A client can publish a job with a valid USD or MMK budget and optional deadline.
2. A freelancer can discover the job and submit one proposal.
3. The client receives a notification and can inspect the proposal details.
4. The client can accept the proposal and both users can open the resulting project.
5. Both users can update project status, create/update milestones, and exchange messages.
6. Notifications link to the correct proposal or project.
7. Unauthorized users cannot access another user’s private proposal, project, milestone, or conversation.
8. The core workflow works with both USD and MMK.

## Decisions to confirm later

- Whether one account may switch between client and freelancer modes.
- Whether pre-proposal messaging should be allowed.
- Whether both participants or only the client can change project status.
- Whether milestones should be client-created only or jointly managed.
- Whether MMK should remain whole-kyat only.
- Which storage provider to use if attachments and portfolio uploads are added.
