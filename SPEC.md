# Archer product specification

Archer is a freelance marketplace where clients find independent talent, agree on project work, and collaborate through delivery.

This document defines product behavior and feature scope across Archer's web and mobile clients. It is intentionally changeable as product decisions evolve. Engineering boundaries and implementation rules live in `AGENTS.md`; setup and run instructions live in the package READMEs.

## Product surfaces

Archer has a web client and a native mobile client backed by the same API and product rules:

- **Web:** browser experience in `app/`.
- **Mobile:** iOS and Android experience in `mobile/`, built with React Native and Expo.
- **API:** shared source of truth for accounts, permissions, business rules, and project data.

The web and mobile clients support the same client and freelancer roles and core marketplace workflow. Mobile screens should be designed for touch, small screens, and native platform conventions while preserving the product behavior and data rules in this specification. Mobile is not a separate marketplace or a reduced-authority client.

The mobile package is planned; this specification describes its intended behavior and does not claim that it is implemented.

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

On mobile, users can register, sign in, stay signed in across app launches, and sign out. Credentials and refresh tokens must use platform-appropriate secure storage. Account actions provide clear loading, validation, and recoverable network error states.

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

Mobile users can review notifications in the app and open the related proposal or project. Push notifications are not required for the MVP; adding them requires a defined permission, delivery, and deep-link experience.

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
- Background location, contacts access, and other device permissions unrelated to an explicitly specified feature.

## Mobile experience requirements

- Support iOS and Android through the Expo app. The mobile client uses the documented `/api/v1` HTTP API and never connects directly to persistence.
- Use touch-sized controls, safe-area-aware layouts, platform keyboards, and native navigation patterns. Long forms and project details remain usable on narrow screens and with the keyboard open.
- Provide loading, empty, error, and success states for data-backed screens. Explain recoverable network failures and let users retry. Do not present a failed server mutation as successful.
- Preserve user input when a recoverable request fails, and make write success clear before navigating away.
- Support accessible labels, readable contrast, scalable text, and screen-reader navigation for primary workflows.
- Keep signed-in sessions secure using platform secure storage. Never store passwords or secrets in source control or ordinary app preferences.
- Treat notification links as untrusted input: validate the destination through the API and signed-in user's authorization before showing private data.
- Display amounts with their currency code and preserve USD-cent / whole-MMK behavior on every mobile screen.
- Do not imply that a project amount has been paid, escrowed, or withdrawn.

### Mobile navigation model

The mobile app should provide clear entry points for:

- Home or dashboard overview.
- Job discovery and job details; clients can also create and manage job briefs.
- Proposals, with role-appropriate received or sent views and proposal details.
- Projects and the participant-only workspace, including milestones and messaging.
- Profile and account actions.
- Notifications and their related proposal or project destinations.

Navigation may use platform-appropriate tabs, stacks, or another native pattern. Navigation structure must not change authorization rules or hide core workflows from either role.

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
9. The core workflow is available in the iOS and Android mobile client through the documented API.
10. Mobile project, proposal, and notification destinations enforce the same participant and ownership boundaries as web.
11. Primary mobile workflows remain usable on narrow screens, with the keyboard open, and when requests return a recoverable network error.

## Decisions to confirm later

- Whether one account may switch between client and freelancer modes.
- Whether pre-proposal messaging should be allowed.
- Whether both participants or only the client can change project status.
- Whether milestones should be client-created only or jointly managed.
- Whether MMK should remain whole-kyat only.
- Which storage provider to use if attachments and portfolio uploads are added.
