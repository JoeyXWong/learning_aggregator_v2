# Product Requirements Document: Learning Aggregator V2

## Overview
Learning Aggregator V2 is a web application that helps users create personalized learning plans for any topic by aggregating and curating the best learning resources from across the internet. The application discovers resources from multiple platforms, classifies them by type and difficulty, generates structured learning paths, and tracks user progress through their learning journey.

**Business Value**: Eliminates the overwhelming process of finding quality learning resources scattered across the internet by providing users with a single, curated, personalized roadmap for mastering any topic.

---

## User Types

### Primary Users
- **Self-Learners**: Individuals learning new topics independently (primary persona)
- **Career Switchers**: Professionals transitioning to new fields who need structured learning paths
- **Students**: Academic learners supplementing formal education with additional resources
- **Hobbyists**: People exploring topics for personal interest

### Secondary Users (Post-MVP)
- **Educators/Mentors**: Teachers recommending learning paths to students
- **Team Leaders**: Managers creating learning plans for team skill development

---

## Domain Terminology

**Key Terms:**
- **Topic**: The subject matter the user wants to learn (e.g., "React", "Machine Learning", "API Design")
- **Resource**: A learning material (video, article, course, book, documentation, tutorial, project)
- **Learning Plan**: A structured, sequenced collection of resources organized by subtopics with estimated timelines
- **Subtopic**: A discrete component of a larger topic (e.g., "Hooks" is a subtopic of "React")
- **Progress Tracking**: Recording completion status and notes for resources in a learning plan
- **Free/Premium Filter**: Classification indicating whether a resource requires payment
- **Difficulty Level**: Classification of resource complexity (Beginner, Intermediate, Advanced)
- **Resource Type**: Format of learning material (Video, Article, Course, Book, Tutorial, Documentation, Project)

---

## User Stories - MVP (Phases 1-5)

## MUST HAVE (P0) - Core MVP Features

### Epic 1: Topic Search & Resource Discovery

#### Story 1.1: Submit Topic for Learning
**Priority**: P0
**As a** self-learner,
**I want to** submit a topic I want to learn about,
**So that** the system can find relevant learning resources for me.

**Acceptance Criteria:**
- [ ] Given I am on the home page, when I enter a topic name in the search input and submit, then the system accepts the topic and initiates resource discovery
- [ ] Given I submit a valid topic, when processing completes, then I see a list of aggregated resources within 30 seconds
- [ ] Given I submit a topic, when an error occurs during discovery, then I see a clear error message explaining what went wrong
- [ ] Given I submit an empty topic string, when I try to submit, then I see a validation error indicating the topic is required
- [ ] Given I submit a topic, when the system is processing, then I see a loading indicator showing progress

**Edge Cases:**
- **Very vague topics** (e.g., "programming"): Show warning suggesting more specific topics, but still process
- **Misspelled topics**: Implement fuzzy matching or "did you mean?" suggestions
- **Very niche topics with few results**: Display message indicating limited resources found, suggest related topics
- **Topics with special characters**: Sanitize input to prevent injection attacks while preserving legitimate characters
- **Extremely long topic names** (>200 chars): Truncate or reject with clear validation message
- **Topics in non-English languages**: Document language support limitations, consider UTF-8 handling

**Technical Considerations:**
- Input sanitization required for security
- Consider rate limiting to prevent abuse
- Topic normalization (case, whitespace) for consistency

---

#### Story 1.2: View Aggregated Resources
**Priority**: P0
**As a** self-learner,
**I want to** view all discovered resources for my topic,
**So that** I can see what learning materials are available.

**Acceptance Criteria:**
- [ ] Given resources have been aggregated for a topic, when I view the results, then I see a list with resource title, type, source platform, and difficulty level
- [ ] Given multiple resources exist, when I view the list, then resources are displayed in a card/list layout with clear visual hierarchy
- [ ] Given a resource has a thumbnail/image, when displayed, then the image loads efficiently without blocking content
- [ ] Given I click on a resource, when the detail view opens, then I see full description, estimated time, ratings, and direct link to the resource
- [ ] Given no resources are found for a topic, when I view results, then I see a helpful message suggesting alternative searches or related topics

**Edge Cases:**
- **0 resources found**: Display empty state with suggestions to broaden search or try related topics
- **1-2 resources found**: Display warning that this is a limited result set
- **500+ resources found**: Implement pagination or virtual scrolling for performance
- **Resources with missing metadata**: Display placeholder values, don't break UI layout
- **Broken external links**: Mark resources as potentially unavailable, consider retry logic
- **Resources with inconsistent quality**: Ensure quality scoring prevents spam/low-quality resources from dominating results

**Technical Considerations:**
- Lazy loading for images and content below fold
- Consider caching strategy for resource lists
- Deduplication logic essential for cross-platform resources

---

#### Story 1.3: Filter Resources by Free vs Premium
**Priority**: P0
**As a** self-learner,
**I want to** filter resources by free vs premium options,
**So that** I can find resources that fit my budget.

**Acceptance Criteria:**
- [ ] Given I am viewing resources, when I select the "Free Only" filter, then only resources marked as free are displayed
- [ ] Given I am viewing resources, when I select "Premium" or "All" filter, then paid resources are included in results
- [ ] Given I have applied a filter, when I change the filter option, then the resource list updates immediately without full page reload
- [ ] Given a resource's pricing status is unclear, when displayed, then it is marked as "Pricing Unknown" and included in both filter views
- [ ] Given I apply the free filter and no free resources exist, when viewing results, then I see a message indicating no free resources are available with option to view premium resources

**Edge Cases:**
- **Freemium resources** (free with paid upgrades): Categorize as "Free" but indicate premium options exist
- **Free trial resources**: Categorize as "Premium" but indicate trial availability
- **Resources that changed from free to paid**: Consider recency of data, mark stale data
- **Platform-specific access** (e.g., free with university email): Document as "Conditionally Free"
- **Filter persistence**: Consider whether filter state should persist across sessions

**Technical Considerations:**
- Free/premium detection accuracy is critical for user trust
- Need clear data model for pricing states (free, freemium, trial, premium, unknown)
- Consider adding "Freemium" as a third category in future iterations

---

#### Story 1.4: Filter Resources by Type
**Priority**: P0
**As a** self-learner,
**I want to** filter resources by type (video, article, course, book, etc.),
**So that** I can focus on my preferred learning format.

**Acceptance Criteria:**
- [ ] Given I am viewing resources, when I select resource type filters, then only resources matching selected types are displayed
- [ ] Given I select multiple types, when viewing results, then resources matching ANY of the selected types are shown (OR logic)
- [ ] Given each resource type, when displayed in filter UI, then I see the count of resources available for that type
- [ ] Given I deselect all filters, when viewing results, then all resource types are shown (default state)
- [ ] Given no resources match selected type filters, when viewing results, then I see a message indicating no matches with option to adjust filters

**Edge Cases:**
- **Resources with multiple types** (e.g., video course with text materials): Tag with primary type, consider secondary type metadata
- **Unclassified resources**: Create "Other" category, improve classification over time
- **New resource types emerge**: Design extensible type system
- **Hybrid formats** (interactive tutorials, code sandboxes): Define clear classification rules

**Technical Considerations:**
- Resource type detection algorithm must be robust
- Support for multi-select filter UI pattern
- Consider filter combinations (e.g., free + video)

---

#### Story 1.5: Filter Resources by Difficulty Level
**Priority**: P0
**As a** self-learner,
**I want to** filter resources by difficulty level,
**So that** I can find materials appropriate for my current skill level.

**Acceptance Criteria:**
- [ ] Given I am viewing resources, when I select difficulty filters (Beginner, Intermediate, Advanced), then only matching resources are displayed
- [ ] Given a resource has no difficulty rating, when displayed, then it is marked as "Difficulty Unspecified" and shown in all filter views
- [ ] Given I select multiple difficulty levels, when viewing results, then resources matching any selected level are shown
- [ ] Given difficulty filter is applied, when combined with other filters, then all filter criteria must be met (AND logic between filter types)
- [ ] Given I hover over difficulty indicator, when tooltip appears, then I see description of what that level means

**Edge Cases:**
- **Difficulty mismatch** (marked beginner but actually advanced): Implement user reporting mechanism for future
- **Prerequisites not obvious**: Consider showing prerequisite topics in future
- **Difficulty creep** (beginner course that becomes advanced): Consider resource segmentation
- **Subjective difficulty ratings**: Document scoring methodology, aggregate multiple signals

**Technical Considerations:**
- Difficulty detection heuristics need validation
- Consider using multiple signals: explicit ratings, reviews, prerequisite analysis
- May need user feedback loop to improve classification accuracy

---

### Epic 2: Learning Plan Generation

#### Story 2.1: Generate Basic Learning Plan
**Priority**: P0
**As a** self-learner,
**I want to** generate a structured learning plan from discovered resources,
**So that** I have a clear roadmap for learning the topic.

**Acceptance Criteria:**
- [ ] Given I have discovered resources for a topic, when I click "Generate Learning Plan", then the system creates a structured plan within 30 seconds
- [ ] Given a learning plan is generated, when I view it, then I see resources organized into logical subtopics/phases
- [ ] Given a learning plan, when displayed, then each section shows estimated time to complete and difficulty progression
- [ ] Given a learning plan is generated, when viewing, then resources are sequenced from foundational to advanced concepts
- [ ] Given an error occurs during generation, when it fails, then I see a clear error message and option to retry

**Edge Cases:**
- **Insufficient resources**: If fewer than 3 resources, display warning that plan may be incomplete
- **No clear sequence**: When topics have no natural progression, document parallel learning paths
- **Circular dependencies**: Detect and resolve prerequisite cycles in topic graph
- **Very short topics**: Plans with <5 hours of content should be flagged as "Quick Start"
- **Very long topics**: Plans exceeding 100 hours should offer phased/milestone breakdowns
- **Resource quality variations**: Ensure low-quality resources don't dominate the plan

**Technical Considerations:**
- Plan generation algorithm is critical to user value
- Consider prerequisite detection for proper sequencing
- Need clear rules for subtopic breakdown
- Caching generated plans for performance

---

#### Story 2.2: Customize Learning Plan Preferences
**Priority**: P0
**As a** self-learner,
**I want to** customize my learning plan preferences before generation,
**So that** the plan matches my constraints and learning style.

**Acceptance Criteria:**
- [ ] Given I am about to generate a plan, when I access preferences, then I can set free-only vs all resources, learning pace (casual/moderate/intensive), and preferred resource types
- [ ] Given I select "free only" preference, when plan is generated, then it contains only free resources
- [ ] Given I select a learning pace, when plan is generated, then time estimates reflect my chosen pace (casual=5hrs/week, moderate=10hrs/week, intensive=20hrs/week)
- [ ] Given I prefer specific resource types, when plan is generated, then those types are prioritized (but not exclusively if insufficient resources)
- [ ] Given I set preferences, when I later generate another plan, then my preferences are remembered within the session

**Edge Cases:**
- **Conflicting preferences**: If "free only + video only" yields no results, relax constraints with user notification
- **Impossible constraints**: Warn user when preferences eliminate too many resources
- **Preference persistence**: Document whether preferences persist across sessions (MVP: no)
- **Skill level specification**: Currently not captured, document as future enhancement

**Technical Considerations:**
- Preference state management in frontend
- Backend must support filtered plan generation
- Consider defaults that work for most users

---

#### Story 2.3: View Learning Plan Timeline
**Priority**: P0
**As a** self-learner,
**I want to** see a visual timeline of my learning plan,
**So that** I understand the time commitment and progression.

**Acceptance Criteria:**
- [ ] Given a learning plan is generated, when I view it, then I see total estimated time to complete prominently displayed
- [ ] Given a plan with multiple phases, when viewing, then each phase shows individual time estimates
- [ ] Given a specific learning pace, when viewing timeline, then I see projected completion date based on pace
- [ ] Given I hover over a phase, when tooltip appears, then I see breakdown of resources and time per resource
- [ ] Given time estimates, when displayed, then they are shown in hours/days/weeks as appropriate for scale

**Edge Cases:**
- **Varying resource time estimates**: Handle missing duration data gracefully with estimates
- **User pace changes**: Recalculate timeline dynamically if pace is adjusted
- **Very short/long timelines**: Scale UI appropriately for 1-hour vs 100-hour plans
- **Timezone considerations**: For projected dates, use user's local timezone

**Technical Considerations:**
- Duration estimation algorithm for resources without explicit time data
- Calendar math for projected completion dates
- Responsive timeline visualization

---

### Epic 3: Plan Export

#### Story 3.1: Export Plan as Markdown
**Priority**: P0
**As a** self-learner,
**I want to** export my learning plan as a Markdown file,
**So that** I can save it locally and read it in my preferred tools.

**Acceptance Criteria:**
- [ ] Given a generated learning plan, when I click "Export as Markdown", then a .md file is downloaded to my device
- [ ] Given the exported markdown, when I open it, then it contains plan title, subtopics, resources with links, time estimates, and difficulty levels in well-formatted markdown
- [ ] Given resources in the plan, when exported, then all links are properly formatted as markdown hyperlinks
- [ ] Given the export includes metadata, when viewing, then I see export date, topic name, and preference settings used to generate the plan
- [ ] Given an export error occurs, when it fails, then I see a clear error message and option to retry

**Edge Cases:**
- **Special characters in content**: Escape markdown special characters properly
- **Very long plans**: Ensure markdown renders properly in common readers
- **Broken resource links**: Include links even if they may be broken (user responsibility to verify)
- **Unicode content**: Ensure UTF-8 encoding in exported file

**Technical Considerations:**
- Markdown generation library or template system
- File download mechanism (client-side vs server-side generation)
- Consistent markdown formatting standards

---

#### Story 3.2: Export Plan as PDF
**Priority**: P0
**As a** self-learner,
**I want to** export my learning plan as a PDF,
**So that** I can print it or share it in a universal format.

**Acceptance Criteria:**
- [ ] Given a generated learning plan, when I click "Export as PDF", then a PDF file is downloaded to my device
- [ ] Given the exported PDF, when I open it, then it is professionally formatted with readable fonts, proper spacing, and clear hierarchy
- [ ] Given the PDF contains resource links, when viewing, then links are clickable and properly formatted
- [ ] Given the PDF has multiple pages, when viewing, then page breaks occur at logical points (not mid-resource)
- [ ] Given the PDF generation takes time, when processing, then I see a loading indicator

**Edge Cases:**
- **Long resource descriptions**: Handle text wrapping and pagination gracefully
- **Special characters**: Ensure proper character encoding in PDF
- **Images/thumbnails**: Decide whether to include resource images (MVP: text-only is acceptable)
- **Very large plans**: Consider file size limits, optimize or paginate if needed
- **Print optimization**: Ensure PDF prints well in black & white

**Technical Considerations:**
- PDF generation library selection (server-side recommended for quality)
- Processing time for large plans may require async job queue
- Consider template-based PDF generation for maintainability

---

### Epic 4: Progress Tracking

#### Story 4.1: Mark Resources as Started/Completed
**Priority**: P0
**As a** self-learner,
**I want to** mark resources in my learning plan as started or completed,
**So that** I can track my progress through the plan.

**Acceptance Criteria:**
- [ ] Given a learning plan with resources, when I click on a resource, then I can mark it as "Not Started", "In Progress", or "Completed"
- [ ] Given I mark a resource with a status, when I refresh the page, then the status persists
- [ ] Given a resource is marked completed, when viewing the plan, then it is visually distinguished (e.g., strikethrough, checkmark, different color)
- [ ] Given I mark a resource, when the status changes, then the overall plan progress percentage updates immediately
- [ ] Given I accidentally mark a resource, when I realize the error, then I can change the status back

**Edge Cases:**
- **Marking resources out of sequence**: Allow free-form marking, don't enforce sequential completion
- **Bulk status updates**: Consider "mark all previous as complete" feature for future
- **Status sync across devices**: MVP is single-device, document limitation
- **Accidental completion**: Make status change reversible with clear UI
- **External resource completion**: System can't verify external completion, relies on user honesty

**Technical Considerations:**
- State persistence mechanism (localStorage for MVP, backend for authenticated version)
- Progress calculation algorithm
- UI state management for status changes

---

#### Story 4.2: View Progress Dashboard
**Priority**: P0
**As a** self-learner,
**I want to** see an overview of my learning progress,
**So that** I stay motivated and understand how much I've completed.

**Acceptance Criteria:**
- [ ] Given I have a learning plan with progress, when I view the dashboard, then I see overall completion percentage prominently displayed
- [ ] Given multiple subtopics in my plan, when viewing progress, then I see completion status per subtopic
- [ ] Given time estimates, when viewing progress, then I see estimated time remaining based on completed vs remaining resources
- [ ] Given I have marked resources complete, when viewing dashboard, then I see list of completed resources with dates
- [ ] Given I have in-progress resources, when viewing dashboard, then they are highlighted for easy continuation

**Edge Cases:**
- **No progress yet**: Display encouraging "Get started" message with first recommended resource
- **100% completion**: Show congratulatory message and suggest related topics
- **Abandoned plans**: If no progress in 30+ days, consider showing re-engagement prompts (future)
- **Progress percentage edge cases**: Handle division by zero, rounding errors

**Technical Considerations:**
- Dashboard should load quickly with minimal computation
- Consider data visualization components for progress display
- Real-time updates vs. refresh-based updates

---

#### Story 4.3: Add Notes to Resources
**Priority**: P1 (Should Have)
**As a** self-learner,
**I want to** add notes to resources I've worked through,
**So that** I can capture key learnings and reflections.

**Acceptance Criteria:**
- [ ] Given a resource in my plan, when I click to add notes, then a text input area appears
- [ ] Given I enter notes for a resource, when I save, then the notes persist with the resource
- [ ] Given a resource has notes, when viewing the plan, then I see an indicator that notes exist
- [ ] Given I want to view notes, when I click on a resource with notes, then the notes are displayed
- [ ] Given I have added notes, when I export the plan, then notes are included in the exported file

**Edge Cases:**
- **Very long notes**: Consider character limit (e.g., 5000 chars) or text area scrolling
- **Rich text formatting**: MVP is plain text, document limitation
- **Note search**: Post-MVP feature, document as future enhancement
- **Note backup**: If using localStorage, notes could be lost; warn user
- **Empty notes**: Allow saving empty notes to clear previous content

**Technical Considerations:**
- Notes storage with resource state
- Consider markdown support in notes for future
- Notes should be included in export functionality

---

### Epic 5: Core Infrastructure

#### Story 5.1: Responsive UI for Mobile/Tablet
**Priority**: P0
**As a** self-learner,
**I want to** access the application on my mobile device,
**So that** I can review my learning plan anywhere.

**Acceptance Criteria:**
- [ ] Given I access the application on a mobile device, when pages load, then layout adapts to screen size without horizontal scrolling
- [ ] Given I interact with filters and buttons on mobile, when I tap, then touch targets are appropriately sized (min 44x44px)
- [ ] Given I view a learning plan on mobile, when scrolling, then content is readable without zooming
- [ ] Given I use the application on tablet, when viewing, then layout utilizes available space effectively
- [ ] Given I rotate my device, when orientation changes, then layout adapts appropriately

**Edge Cases:**
- **Very small screens** (<320px): Test on smallest supported devices
- **Large tablets**: Consider tablet-specific layouts that differ from mobile and desktop
- **Landscape vs portrait**: Ensure both orientations work well
- **Touch interactions**: Ensure no hover-only functionality
- **Offline usage**: Document that MVP requires internet connection

**Technical Considerations:**
- Mobile-first responsive design approach
- Test on real devices, not just browser emulation
- Consider progressive web app (PWA) features for future

---

#### Story 5.2: Error Handling and User Feedback
**Priority**: P0
**As a** self-learner,
**I want to** receive clear feedback when errors occur,
**So that** I understand what went wrong and what to do next.

**Acceptance Criteria:**
- [ ] Given an API error occurs, when the error is displayed, then I see a user-friendly message (not technical jargon)
- [ ] Given a network error occurs, when displayed, then I see indication that the issue is connection-related with retry option
- [ ] Given an operation is processing, when waiting, then I see loading indicators that prevent duplicate submissions
- [ ] Given a validation error, when input is invalid, then I see inline error messages near the problematic field
- [ ] Given a successful operation, when completed, then I see confirmation message (e.g., "Plan exported successfully")

**Edge Cases:**
- **Timeout errors**: Display clear timeout message with retry button
- **Rate limiting**: Inform user they're making too many requests, show cooldown time
- **Partial failures**: If 1 of 5 export formats fails, communicate partial success
- **Backend unavailable**: Show maintenance message with expected resolution time if available
- **Browser compatibility issues**: Detect and warn about unsupported browsers

**Technical Considerations:**
- Consistent error handling strategy across frontend and backend
- Error logging for debugging
- User-friendly error messages mapping from technical errors
- Consider error boundary components in React

---

## SHOULD HAVE (P1) - Important for MVP Quality

#### Story 6.1: Save Learning Plans
**Priority**: P1
**As a** self-learner,
**I want to** save my generated learning plans,
**So that** I can return to them later without regenerating.

**Acceptance Criteria:**
- [ ] Given I generate a learning plan, when I click "Save Plan", then the plan is saved locally with a unique identifier
- [ ] Given I have saved plans, when I access the application, then I see a list of my saved plans
- [ ] Given I click on a saved plan, when opened, then all plan details and progress are restored
- [ ] Given I have saved plans, when I want to delete one, then I can remove it from my saved list
- [ ] Given I save a plan, when I close the browser and return, then my saved plans are still available

**Edge Cases:**
- **Storage quota exceeded**: Handle localStorage limits, warn user or implement cleanup
- **Plan versioning**: If plan generation logic changes, handle legacy saved plans gracefully
- **Export saved plans**: Ensure save/restore works with export functionality
- **Multiple devices**: MVP is single-device, document limitation clearly

**Technical Considerations:**
- LocalStorage for MVP (no backend/auth required)
- Consider IndexedDB for larger storage capacity
- Plan serialization and deserialization
- Migration strategy if data schema changes

---

#### Story 6.2: Search Within Resources
**Priority**: P1
**As a** self-learner,
**I want to** search for specific keywords within discovered resources,
**So that** I can quickly find resources covering specific concepts.

**Acceptance Criteria:**
- [ ] Given I am viewing a list of resources, when I enter a search term, then resources are filtered to those matching the term in title or description
- [ ] Given I have applied other filters, when I search, then search works in combination with existing filters
- [ ] Given no resources match my search, when viewing results, then I see "No results found" with option to clear search
- [ ] Given I search with special characters, when processing, then the search handles them gracefully without errors
- [ ] Given I clear my search, when cleared, then all resources matching other active filters are displayed again

**Edge Cases:**
- **Very short search terms** (1-2 chars): Consider minimum length requirement or debouncing
- **Case sensitivity**: Search should be case-insensitive
- **Partial matches**: Support substring matching
- **Search performance**: With 500+ resources, search must remain fast

**Technical Considerations:**
- Client-side search for MVP (resources already loaded)
- Debouncing search input to avoid excessive filtering
- Consider fuzzy search for typo tolerance in future

---

#### Story 6.3: Resource Quality Indicators
**Priority**: P1
**As a** self-learner,
**I want to** see quality indicators for resources,
**So that** I can prioritize high-quality learning materials.

**Acceptance Criteria:**
- [ ] Given a resource with rating data, when displayed, then I see the rating score (e.g., 4.5/5 stars)
- [ ] Given a resource with review count, when displayed, then I see number of reviews/ratings
- [ ] Given a resource's publish/update date, when displayed, then I see how recent the content is
- [ ] Given multiple quality signals, when viewing, then resources with higher quality scores are ranked higher in plan
- [ ] Given quality data is unavailable, when displayed, then resource shows "Not rated" or similar indicator without breaking layout

**Edge Cases:**
- **Conflicting quality signals**: Resource with high rating but very old content
- **Fake/manipulated ratings**: Consider platform reputation in quality score
- **New resources**: Resources with few reviews shouldn't be penalized
- **Subjective quality**: Document quality scoring methodology

**Technical Considerations:**
- Aggregate quality score algorithm combining multiple signals
- Freshness weighting (newer content may be valued higher for tech topics)
- Platform-specific rating normalization

---

#### Story 6.4: Estimate Learning Time Accurately
**Priority**: P1
**As a** self-learner,
**I want to** see accurate time estimates for resources and plans,
**So that** I can plan my learning schedule realistically.

**Acceptance Criteria:**
- [ ] Given a resource with explicit duration data, when displayed, then I see the accurate duration
- [ ] Given a resource without duration data, when displayed, then I see an estimated duration based on resource type and length
- [ ] Given a learning plan, when viewing total time, then it accounts for different learning paces
- [ ] Given a course with multiple sections, when calculating time, then all sections are included in estimate
- [ ] Given time estimates, when displayed, then they include both content consumption and practice/application time where applicable

**Edge Cases:**
- **Video resources**: Duration is clear, but practice time should be added
- **Books**: Estimate based on page count and average reading speed
- **Interactive courses**: Include lab/exercise time beyond lecture time
- **Documentation**: Estimate based on length and complexity
- **Projects**: Time highly variable, provide ranges or mark as "varies"

**Technical Considerations:**
- Heuristics for estimating duration by resource type
- Consider user-reported time data to improve estimates (future)
- Distinguish between passive (watching) and active (doing) learning time

---

## COULD HAVE (P2) - Nice to Have, Post-MVP

#### Story 7.1: Share Learning Plans
**Priority**: P2
**As a** self-learner,
**I want to** share my learning plan with others via a link,
**So that** friends or colleagues can use the same plan.

**Acceptance Criteria:**
- [ ] Given I have a generated plan, when I click "Share", then I receive a shareable URL
- [ ] Given someone accesses my shared plan URL, when they open it, then they see the same plan structure and resources
- [ ] Given a shared plan, when accessed by others, then they can save their own copy without affecting my original
- [ ] Given a shared plan, when viewing, then progress is NOT shared (each user has independent tracking)

**Edge Cases:**
- **Stale resources**: Resources in shared plans may become unavailable over time
- **Plan expiration**: Consider whether shared plans should expire after a period
- **Privacy**: Ensure no personal data is exposed in shared plans
- **URL structure**: Keep URLs reasonably short and clean

**Technical Considerations:**
- Requires backend to store plans and generate unique IDs
- Consider plan cloning/forking functionality
- URL shortening or readable slugs

---

#### Story 7.2: Compare Multiple Topics
**Priority**: P2
**As a** self-learner,
**I want to** compare resource availability for multiple related topics,
**So that** I can decide which topic to pursue.

**Acceptance Criteria:**
- [ ] Given I want to compare topics, when I select multiple topics, then I see side-by-side comparison of resource counts, free vs premium ratios, and average difficulty
- [ ] Given comparison data, when viewing, then I can see which topic has more comprehensive free resources
- [ ] Given multiple topics, when comparing, then I see estimated time to learn each topic

**Edge Cases:**
- **Limit comparison count**: Max 3-5 topics to keep UI manageable
- **Very different topics**: Comparison may not be meaningful for unrelated topics

**Technical Considerations:**
- Requires fetching resources for multiple topics simultaneously
- Comparison UI/UX design

---

#### Story 7.3: Topic Suggestions and Autocomplete
**Priority**: P2
**As a** self-learner,
**I want to** see topic suggestions as I type,
**So that** I can discover popular topics and correct misspellings.

**Acceptance Criteria:**
- [ ] Given I start typing a topic, when I've entered 3+ characters, then I see autocomplete suggestions
- [ ] Given autocomplete suggestions, when displayed, then they include popular topics and recent searches
- [ ] Given I select a suggestion, when clicked, then the topic input is filled and submitted

**Edge Cases:**
- **No suggestions available**: Show message or allow freeform entry
- **Suggestion relevance**: Ensure suggestions are actually relevant to input

**Technical Considerations:**
- Autocomplete data source (static list, API, or search index)
- Debouncing input to avoid excessive API calls
- Keyboard navigation for suggestions

---

#### Story 7.4: Dark Mode Support
**Priority**: P2
**As a** self-learner,
**I want to** use the application in dark mode,
**So that** I can reduce eye strain when learning at night.

**Acceptance Criteria:**
- [ ] Given I enable dark mode, when activated, then all UI elements adapt to dark theme
- [ ] Given I have dark mode enabled, when I return to the app, then my preference is remembered
- [ ] Given system dark mode is enabled, when I first visit, then the app defaults to dark mode

**Edge Cases:**
- **Embedded content**: External resource previews may not support dark mode
- **Print styles**: Ensure print/PDF export still uses light theme

**Technical Considerations:**
- CSS custom properties for theme switching
- Respect system preferences via `prefers-color-scheme`
- Theme preference persistence

---

## WON'T HAVE (This Iteration) - Explicitly Out of Scope for MVP

- **User Authentication/Accounts**: MVP uses localStorage, no login required
- **Social Features**: Comments, ratings, community discussions
- **Collaborative Learning**: Study groups, shared progress
- **Spaced Repetition**: Reminders and review scheduling
- **Quizzes/Assessments**: Testing knowledge acquisition
- **Certificate Generation**: Completion certificates
- **Mobile Native Apps**: Web-only for MVP
- **Offline Mode**: Requires internet connection
- **Multi-language Support**: English-only for MVP
- **Advanced AI Features**: Conversational refinement, AI tutoring
- **Resource Contribution**: Users suggesting resources
- **Custom Curriculum Builder**: Advanced manual plan editing beyond basic reordering
- **Integration with Learning Platforms**: Direct enrollment, LMS integration
- **Analytics Dashboard**: Detailed learning analytics beyond basic progress
- **Video Playback**: Embedded video players (MVP links to external platforms)

---

## Non-Functional Requirements

### Performance
- **Page Load Time**: Initial page load under 3 seconds on 3G connection
- **Plan Generation Time**: Learning plans generated in under 30 seconds for typical topics
- **Resource Discovery Time**: Aggregate resources for a topic within 30 seconds
- **API Response Time**: 95th percentile response time under 2 seconds for all endpoints
- **Large Dataset Handling**: Application remains responsive with 500+ resources displayed
- **Export Performance**: PDF export completes within 10 seconds for typical plans

### Scalability
- **Concurrent Users**: MVP should support at least 100 concurrent users
- **Resource Database**: System should handle 10,000+ resources efficiently
- **Growth Headroom**: Architecture should allow scaling to 1,000+ concurrent users post-MVP

### Reliability
- **Uptime Target**: 95% uptime for MVP (acknowledge this is a learning project)
- **Error Recovery**: Graceful degradation when external APIs fail (fallback to cached data)
- **Data Persistence**: User progress and saved plans must persist reliably in localStorage
- **Retry Logic**: Failed API requests should retry with exponential backoff

### Security
- **Input Sanitization**: All user inputs must be sanitized to prevent XSS attacks
- **API Security**: External API keys must not be exposed in client-side code
- **HTTPS**: All production traffic must use HTTPS
- **Rate Limiting**: Implement rate limiting to prevent abuse (100 requests per hour per IP for MVP)
- **Content Security Policy**: Implement CSP headers to prevent injection attacks
- **CORS Configuration**: Properly configured CORS for API endpoints

### Accessibility (WCAG 2.1 Level AA Compliance)
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Screen Reader Support**: Semantic HTML and ARIA labels where needed
- **Color Contrast**: Minimum 4.5:1 contrast ratio for text
- **Focus Indicators**: Clear focus indicators for all interactive elements
- **Text Alternatives**: Alt text for images and icons
- **Responsive Text**: Text must be resizable up to 200% without breaking layout
- **Form Labels**: All form inputs must have associated labels

### Usability
- **Intuitive Navigation**: Users should be able to generate a learning plan within 3 clicks
- **Clear CTAs**: Primary actions (Search, Generate Plan, Export) should be immediately obvious
- **Helpful Empty States**: When no data exists, show helpful guidance on what to do next
- **Loading Indicators**: All async operations show clear loading states
- **Error Messages**: Errors must be user-friendly, not technical jargon

### Browser Compatibility
- **Modern Browsers**: Support latest 2 versions of Chrome, Firefox, Safari, Edge
- **Mobile Browsers**: iOS Safari 13+, Chrome Mobile
- **Progressive Enhancement**: Core functionality should work even with JavaScript disabled (graceful degradation)

### Data Privacy
- **No Personal Data Collection**: MVP does not collect email, name, or personal information
- **Anonymous Usage**: All usage is anonymous unless user explicitly creates account (post-MVP)
- **localStorage Notice**: Users should be informed that data is stored locally and not backed up
- **Third-Party Resources**: External resource links are user's responsibility; no tracking beyond initial aggregation

### Maintainability
- **Code Documentation**: All complex algorithms must have inline comments explaining logic
- **Component Modularity**: UI components should be reusable and well-isolated
- **API Documentation**: OpenAPI/Swagger docs for all API endpoints
- **Testing Coverage**: Minimum 70% code coverage for backend logic
- **Linting/Formatting**: Consistent code style enforced via automated tooling

---

## Technical Constraints

### Known Limitations
- **External API Dependencies**: Resource discovery depends on external API availability and rate limits
- **Data Freshness**: Resource metadata may become stale; requires periodic refresh strategy
- **Link Rot**: External resource links may break over time; difficult to detect automatically
- **Classification Accuracy**: Automated difficulty/type classification may have errors
- **No Real-Time Collaboration**: MVP is single-user; shared plans are snapshots, not live documents

### Technical Risks
- **API Rate Limits**: Educational platform APIs may have restrictive rate limits
- **Web Scraping Fragility**: Site structure changes can break scrapers
- **PDF Generation Complexity**: Server-side PDF generation adds infrastructure complexity
- **localStorage Size Limits**: Browser localStorage typically limited to 5-10MB
- **Plan Generation Quality**: Algorithm quality directly impacts user value; requires iteration

### Infrastructure Requirements
- **Backend API**: RESTful API server (Node.js/Python/Go)
- **Database**: PostgreSQL or MongoDB for storing resources, plans, and metadata
- **Caching Layer**: Redis or in-memory cache for frequently accessed resources
- **Job Queue**: Background job processing for long-running tasks (plan generation, PDF export)
- **Frontend**: React/Vue/Svelte SPA with responsive design
- **Hosting**: Cloud platform supporting backend + frontend + database (Vercel/Railway/Render)

---

## Open Questions

1. **Scope of Resource Sources**: Which specific platforms/APIs should be prioritized for MVP? (Udemy, Coursera, YouTube, freeCodeCamp, GitHub, MDN, etc.)

2. **Plan Customization Depth**: How much manual editing of generated plans should be allowed? (Reordering, removing resources, substituting?)

3. **Quality Score Weighting**: What relative weights should be given to recency, ratings, and platform reputation in quality scoring?

4. **Subtopic Detection**: Should subtopic breakdown be AI-powered (LLM) or rule-based for MVP? What's the performance/quality trade-off?

5. **Free Resource Definition**: How should we classify free trials, freemium content, and conditionally free resources (e.g., free with .edu email)?

6. **Difficulty Detection**: What signals should be used to detect difficulty? (Keywords, course descriptions, prerequisite analysis?)

7. **Export Format Priority**: Which export formats are most important to users? (Markdown confirmed, PDF confirmed, what about JSON, CSV, iCal?)

8. **Progress Persistence Strategy**: Should MVP include a backend for progress sync, or is localStorage sufficient?

9. **Rate Limiting Strategy**: What are acceptable rate limits for external APIs? What's the fallback when limits are hit?

10. **Caching Strategy**: How long should resource data be cached before refresh? (1 week, 1 month?)

11. **Error Handling Philosophy**: Should the app fail fast or continue with degraded functionality when external APIs fail?

12. **Mobile Experience Priority**: How much should mobile UX differ from desktop? (Same features vs. simplified mobile view?)

---

## Assumptions

1. **Target Audience**: Primary users are self-motivated adult learners comfortable with technology
2. **English Content**: MVP focuses on English-language resources only
3. **Tech Topics Focus**: Initial launch targets tech/programming topics before expanding to other domains
4. **Internet Connectivity**: Users have reliable internet access; offline mode not required for MVP
5. **Modern Browsers**: Users are on recent browser versions supporting modern web standards
6. **Free Tier APIs**: External platform APIs offer sufficient free tier limits for MVP traffic
7. **Manual Quality Control**: Initial resource quality validation is manual; automated validation post-MVP
8. **No Monetization**: MVP is free to use; business model consideration is post-MVP
9. **Single User Focus**: Users work independently; collaborative features are post-MVP
10. **No Content Hosting**: Application links to external resources; does not host or proxy content
11. **Trust External Platforms**: Resource availability and quality rely on external platforms maintaining their content
12. **Learning Pace Defaults**: Casual=5hrs/week, Moderate=10hrs/week, Intensive=20hrs/week are reasonable estimates
13. **Time Estimates**: Users can dedicate their chosen learning pace consistently (acknowledges real-world variance)
14. **Quality over Quantity**: Better to show 20 high-quality resources than 200 mixed-quality ones

---

## Success Metrics (MVP Definition of Done)

### Functional Completeness
- [ ] Users can search for any topic and receive resource results within 30 seconds
- [ ] Free vs. premium filtering works accurately for at least 90% of resources
- [ ] Resource type and difficulty filters function correctly
- [ ] Learning plans are generated with logical subtopic breakdown and sequencing
- [ ] Plans can be exported as Markdown and PDF without errors
- [ ] Progress tracking persists across browser sessions via localStorage
- [ ] Responsive UI works on mobile, tablet, and desktop screen sizes

### Quality Benchmarks
- [ ] At least 20 diverse tech topics can generate comprehensive plans (50+ resources each)
- [ ] 80%+ of generated plans receive positive user feedback on structure/quality
- [ ] Resource classification accuracy (type, difficulty) is 85%+
- [ ] Less than 5% of resources have broken links at plan generation time
- [ ] 95th percentile page load time under 3 seconds
- [ ] Zero critical accessibility violations per WCAG 2.1 AA standards

### User Experience
- [ ] Users can generate their first learning plan within 2 minutes of landing on the site
- [ ] 90%+ of users successfully export a plan in their first session
- [ ] Error messages are clear enough that users don't need support documentation
- [ ] Mobile users can complete all core workflows without frustration

### Technical Health
- [ ] All API endpoints have response times under 2s (95th percentile)
- [ ] Frontend passes linting with zero errors
- [ ] Backend has minimum 70% test coverage
- [ ] No security vulnerabilities in dependency scan
- [ ] Application remains responsive with 100 concurrent users

---

## Appendix: Data Model Overview

### Core Entities (High-Level)

**Topic**
- ID (unique identifier)
- Name (user-provided topic string)
- Normalized Name (cleaned, lowercased)
- Created Timestamp
- Last Aggregation Timestamp
- Subtopics (array of subtopic names)

**Resource**
- ID (unique identifier)
- Title
- Description
- URL
- Type (Video, Article, Course, Book, Tutorial, Documentation, Project)
- Difficulty (Beginner, Intermediate, Advanced, Unspecified)
- Pricing (Free, Freemium, Premium, Unknown)
- Platform (Udemy, Coursera, YouTube, GitHub, etc.)
- Duration (estimated hours)
- Rating (aggregated score)
- Review Count
- Publish/Update Date
- Tags (array of relevant keywords)
- Quality Score (computed)

**Learning Plan**
- ID (unique identifier)
- Topic Reference
- User Preferences (free-only, pace, preferred types)
- Generated Timestamp
- Phases (array of plan phases)
  - Phase Name (subtopic)
  - Resources (ordered array of resource references)
  - Estimated Duration
- Total Duration
- Progress (percentage complete)

**Progress Tracking**
- Plan ID Reference
- Resource ID Reference
- Status (Not Started, In Progress, Completed)
- Started Date
- Completed Date
- Notes (user-provided text)
- Time Spent (user-reported, optional)

---

## Appendix: API Endpoint Summary (High-Level)

### Resource Discovery
- `POST /api/topics` - Submit topic for aggregation
- `GET /api/topics/:id/resources` - Get all resources for a topic
- `GET /api/resources/search` - Search resources with filters

### Learning Plans
- `POST /api/plans/generate` - Generate learning plan with preferences
- `GET /api/plans/:id` - Retrieve saved plan
- `GET /api/plans/:id/export?format={markdown|pdf|json}` - Export plan

### Progress Tracking
- `POST /api/progress` - Create/update progress for a resource
- `GET /api/progress/:planId` - Get all progress for a plan
- `GET /api/progress/stats` - Get aggregate progress statistics

---

## Next Steps for Engineering Team

1. **Tech Stack Decision**: Review tech stack recommendations in MILESTONES.md and finalize choices
2. **Architecture Design**: Create high-level architecture diagram showing frontend, backend, database, and external integrations
3. **Database Schema**: Design detailed schema based on data model overview above
4. **API Contract**: Create OpenAPI specification for all endpoints
5. **Resource Discovery Research**: Investigate external API options and rate limits for each platform
6. **Plan Generation Algorithm**: Design algorithm for subtopic breakdown and resource sequencing
7. **Development Environment**: Set up local development environment with linting, formatting, testing frameworks
8. **Sprint Planning**: Break user stories into technical tasks and estimate effort
9. **Prototyping**: Consider building a proof-of-concept for resource discovery and plan generation before full implementation
10. **User Testing Plan**: Define how to gather user feedback during development (dogfooding, beta users)

---

**Document Version**: 1.0
**Last Updated**: 2026-02-07
**Author**: Product Manager Agent
**Status**: Ready for Review
