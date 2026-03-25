# Product Requirements Document: Bhishi PWA

## 1. Project Overview
**Bhishi** is a community-driven financial management platform designed to digitize traditional "Chit Fund" or "ROSCAs" (Rotating Savings and Credit Associations). It simplifies the complex task of tracking monthly contributions, managing payout rotations, and ensuring transparency among community members.

---

## 2. User Flow & Navigation
1.  **Onboarding:** User enters Name & Phone → System verifies/creates account → User lands on Dashboard.
2.  **Creation:** User clicks "New Group" → Fills details (Amount, Members, Date) → Adds members → Group is initialized with a 12-month schedule.
3.  **Management:** User selects a Group → Views monthly status → Marks payments as "Paid" → Views who is receiving the payout this month.
4.  **Settings:** User toggles Language (EN/HI/MR) → Selects Theme → Enables Push Notifications → Exports/Restores data.

---

## 3. Detailed Page Breakdown

### A. Authentication / Landing Page
*   **Purpose:** Entry point for users.
*   **Components:**
    *   `AuthView`: Full-screen container with a "Warm Organic" aesthetic.
    *   `Input`: Custom styled phone and name inputs with validation.
    *   `Button`: Primary action button with loading states.
*   **Logic:** Checks `localStorage` for an existing session. If found, it verifies the ID with the backend `/api/auth/verify/:id`.

### B. Main Dashboard
*   **Purpose:** High-level overview of all financial commitments.
*   **Components:**
    *   `StatsCard`: Displays "Total Savings," "Monthly Commitment," and "Active Groups."
    *   `GroupCard`: Horizontal scroll or list of active groups showing name, next payout date, and a progress bar.
    *   `AlertsBanner`: Shows upcoming deadlines or pending payments.
    *   `BottomNav`: Persistent navigation for Dashboard, Alerts, and Profile.
*   **User Flow:** Tapping a `GroupCard` navigates to the **Group Detail View**.

### C. Group Detail View
*   **Purpose:** Granular management of a specific Bhishi group.
*   **Sections:**
    *   **Header:** Group name, total pool amount, and interest rate.
    *   **Month Selector:** A horizontal "Pill" list to switch between months (Month 1 to Month 12).
    *   **Payout Info:** Displays the member scheduled to receive the pool for the selected month.
    *   **Member List:** A list of all members showing:
        *   Payment status (Pending/Paid).
        *   "Mark as Paid" button (Admin only).
        *   Payment timestamp and method.
*   **Components:** `StatusBadge`, `MemberRow`, `MonthPill`.

### D. Create Group View
*   **Purpose:** Step-by-step wizard to initialize a new association.
*   **Form Fields:**
    *   Basic Info: Name, Description, Monthly Amount.
    *   Schedule: Start Date, Payout Day (1st-31st).
    *   Members: Dynamic input list to add member names and phone numbers.
*   **Logic:** Automatically calculates the total pool and assigns payout months to members sequentially.

### E. Settings & Profile View
*   **Purpose:** Personalization and data management.
*   **Features:**
    *   **Theme Picker:** Grid of 6 color palettes (Emerald, Rose, Amber, etc.) that update the global CSS variables.
    *   **Language Toggle:** Seamlessly switches the app between English, Hindi, and Marathi using a translation dictionary.
    *   **Notification Toggle:** Requests browser permissions and registers the Service Worker for Push Notifications.
    *   **Data Tools:** Buttons to trigger JSON export and file-upload for restoration.

---

## 4. Component Library (Frontend)

| Component | Description | Key Props |
| :--- | :--- | :--- |
| `Button` | High-impact action button with `motion` hover/tap effects. | `variant`, `loading`, `icon` |
| `Card` | Container with `rounded-3xl` and subtle `stone-100` borders. | `padding`, `shadow` |
| `ProgressBar` | Visual indicator of group completion or payment collection. | `value`, `max`, `color` |
| `Modal` | Animated overlay for confirmations (e.g., Delete Account). | `isOpen`, `onClose`, `title` |
| `EmptyState` | Illustrated view when no groups or alerts exist. | `message`, `action` |

---

## 5. Technical Architecture (Production Level)

### Frontend (React + Vite)
*   **PWA:** Uses `manifest.json` and a Service Worker for offline caching and background push events.
*   **State:** Centralized `App` component manages the user session and view routing.
*   **Styling:** Tailwind CSS with a custom `@theme` block in `index.css` for dynamic theme injection.

### Backend (Node.js + Express)
*   **API Design:** RESTful endpoints for `/api/groups`, `/api/members`, and `/api/payments`.
*   **Security:** 
    *   Foreign Key constraints in SQLite to prevent orphaned data.
    *   Input validation on all POST requests.
    *   Session verification on every app launch.
*   **Cron Jobs:** `node-cron` runs daily at 09:00 to trigger push notifications for upcoming deadlines.

### Database (SQLite)
*   **Relational Schema:** Optimized for cascading deletes (e.g., deleting a group removes all its memberships and payments).
*   **Indexing:** Indexed on `phone` and `user_id` for sub-millisecond query performance.

---

## 6. Production Checklist
1.  **VAPID Keys:** Ensure `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` are set in environment variables for notifications.
2.  **SSL:** The app must run over HTTPS (required for Service Workers and Push API).
3.  **Error Logging:** Server-side `console.error` logs are implemented for debugging database constraints.
4.  **Responsive Design:** Tested for viewport widths from 320px (iPhone SE) to 1440px (Desktop).
