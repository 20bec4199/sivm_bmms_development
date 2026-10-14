# SIVM User Manual

A simple guide for organization administrators, building managers, technicians, and residents.

## 1. Sign In

1. Open your organization's SIVM website.
2. Enter your email address and password, then select **Sign in**.
3. You will see the pages available to your account. Menus can differ by role and enabled organization modules.

For the demo accounts created by the seed scripts, the temporary password is `Password123`. Change it after signing in. These are demonstration accounts; do not use the shared password for real users.

| Demo email | Role |
|---|---|
| `admin1@tamilapartments.com` | Organization administrator |
| `admin2@tamilapartments.com` | Organization administrator |
| `manager@tamilapartments.com` | Building manager |
| `admin@platform.com` | Platform administrator |

Demo resident accounts include `rajesh.kannan@example.com` and `meera.n@example.com`; their temporary password is also `Password123`.

If sign-in does not work, check the email and password, then ask your organization administrator to confirm that your account is active and has the right role.

## 2. Know Your Role

- **Organization administrator:** manages organization users, buildings, facilities, equipment, and maintenance plans.
- **Building manager:** manages assigned buildings and day-to-day facilities and maintenance work. Some organization-wide settings are reserved for administrators.
- **Technician:** works on assigned work orders and records progress and checklist results.
- **Resident:** requests facility bookings and can use resident services available to their account.
- **Platform administrator:** manages organizations and platform-wide settings. This role is for the software operator, not normal property work.

If a page is missing or says access is unavailable, ask an organization administrator to check your role and whether the relevant module is enabled.

## 3. Facilities and Bookings

### Administrator or building manager: add a facility

1. Open **Organization → Facilities**.
2. Select **Add Facility** or the plus button.
3. Choose the building. This is required.
4. Enter the facility name, category, capacity, and any fee or deposit.
5. Add rules residents should follow. Choose any available tower, floor, or unit location details.
6. Save. Confirm the facility appears in the facilities list and is active.

Examples include a gym, pool, community hall, or meeting room. The demo seed creates Fitness Centre, Swimming Pool, and Community Hall.

### Resident: request a booking

1. Open **Resident → Facilities**.
2. Select a facility and an available date and time.
3. Enter the number of attendees and the reason for the booking.
4. Submit the request.
5. Check **Resident → My Bookings** for its status. A request may need staff approval before it is confirmed.

### Staff: review requests

1. Open **Organization → Facilities** and select the bookings view.
2. Find requests marked **Pending**.
3. Review the facility, time, and attendee count.
4. Approve or reject the request using the available action. Add a reason when rejecting.

Avoid promising a booking until it is approved or confirmed. Check the facility schedule before approving overlapping requests.

## 4. Equipment and Asset Register

1. Open **Organization → Assets**.
2. Select **Categories** to review or add categories such as HVAC Equipment, Water Systems, or Safety Equipment.
3. Return to **Inventory** and choose **Add Asset**.
4. Enter the equipment name, asset tag, category, location, and any known serial number, purchase cost, and warranty expiry.
5. Save. Use the status filter to find active, inactive, or equipment under repair.
6. Open the **Warranty** tab to review equipment whose warranty is nearing expiry.
7. If equipment needs work, use its work-order action if available, or open **Organization → Work Orders** and create a work order for it.

The demo seed creates four sample assets, including a rooftop chiller, air handling unit, booster pump, and fire alarm panel. Warranty dates are set relative to the seed run so the warranty view remains useful.

### Inventory limitation

The Assets page's **Inventory** tab is an equipment/asset register. The current application does not provide stock quantities, consumable parts, stock receiving, or stock issue transactions. Do not use it to track spare-part counts. Those inventory functions need to be implemented separately.

## 5. Preventive Maintenance

### Review or create a plan

1. Open **Organization → Maintenance Plans**.
2. Review plan name, location, linked facility or equipment, frequency, next due date, and status.
3. To add one, select **Create Plan** and complete the wizard:
   - **Basic Regimen:** enter a clear name, category, priority, and description.
   - **Spatial Scope:** choose the building or other applicable location.
   - **Facility & Assets:** link the equipment and facilities that need maintenance.
   - **Recurrence & Techs:** choose how often it is due and set the next date.
   - **Safety Checklists:** add the steps a technician must complete.
4. Publish the plan and confirm that it appears in the plans list.

The demo seed creates three plans: monthly chiller inspection, quarterly booster pump service, and monthly fire alarm panel test.

### Generate and complete the maintenance work

1. From the plan list, choose **Spawn WO** (generate work order) for the plan that is due.
2. Open **Organization → Work Orders** and locate the new order.
3. Assign it to a technician. Check the due date, equipment, location, and checklist.
4. The technician opens **Technician → Work Orders**, selects the assigned order, and records progress and checklist results.
5. When the work is done, update the order to its appropriate completed status and add notes or evidence where available.

A plan does not automatically create a work order on its due date. A user must generate the work order. Automatic technician assignment is also not currently implemented; assign the order manually.

## 6. Work Orders

Administrators and building managers can create a work order from **Organization → Work Orders**. Enter a short title, describe the problem, choose its priority, and add the asset or location if applicable. Assign a technician and due date when known.

Technicians should open their work-order list regularly, update the status as work progresses, complete required checklist steps, and record what they did. If parts are unavailable, note that in the work-order notes and tell the building manager; the software does not track stock availability.

## 7. Seeded Demo Data

The demo records belong to the **Tamil Apartments** organization. The seed creates buildings, residents, facilities, bookings, equipment assets, and preventive maintenance plans. Run the base seed before the demo seed. Re-running the demo seed refreshes its named facilities, tagged assets, plans, and checklists; do not treat demo records as real property data.

For a hosted database, an administrator should apply schema changes and run both seed commands from a controlled deployment or database maintenance process:

```bash
npx prisma db push
npx prisma db seed
npm run db:seed:demo
```

Do not use `db:reset` on a database that contains data you need; it deletes database records. Confirm the target database before running any seed or schema command.

## 8. Important Notes

- This manual describes the current application. Buttons and menu names may differ slightly according to your account role.
- The resident booking list currently may show organization-wide bookings rather than only the signed-in resident's bookings. Treat booking data as staff-visible until this access-filtering issue is fixed; avoid exposing the resident booking list to production residents before then.
- Demo accounts use shared, known passwords. Change or disable them before opening the application to real users.
- If a page looks empty, check that you are signed into the correct organization and that the organization has the needed module enabled. Refresh the page after a staff member changes your role or access.
- The hosted free backend may take a short time to wake after inactivity. Retry once after a brief wait if the first request fails.
