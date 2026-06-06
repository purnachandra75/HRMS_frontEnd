# Quick Start Guide

## Getting Started (3 Simple Steps)

### Step 1: Install Dependencies
Open PowerShell/Command Prompt in the `employee management` folder and run:
```bash
npm install
```
This will install all required packages (React, React Router, etc.)

### Step 2: Start Development Server
Run:
```bash
npm start
```
The app will automatically open in your browser at `http://localhost:3000`

### Step 3: Login & Explore
Use these demo accounts to test:

**Admin Access:**
- Email: admin@example.com
- Password: admin123
- Features: View, Edit, Delete all employees

**Employee Access:**
- Email: emp@example.com
- Password: emp123
- Features: View & edit your own profile

---

## What's Included

### 📁 Complete React Application
✓ Login & Registration pages
✓ Admin Dashboard (manage employees)
✓ Employee Dashboard (manage profile)
✓ Employee Profile page (edit details)
✓ Responsive design (works on mobile & desktop)

### 🎨 Styling
✓ Modern gradient UI
✓ Interactive buttons and forms
✓ Mobile-responsive layout
✓ Error handling with messages

### 🔐 Features
✓ Role-based access (Admin vs Employee)
✓ Session persistence (stays logged in)
✓ Form validation
✓ Edit modal for admins
✓ Profile management for employees

---

## Project Files Created

### Main Application
- `src/App.js` - Main app router and state management
- `src/index.js` - Entry point
- `public/index.html` - HTML template

### Pages (in `src/pages/`)
- `Login.js` - Login page
- `Register.js` - Registration page
- `AdminDashboard.js` - Admin view (all employees table)
- `EmployeeDashboard.js` - Employee welcome page
- `EmployeeProfile.js` - Employee profile edit page

### Components (in `src/components/`)
- `EmployeeEditModal.js` - Modal for admin to edit employees

### Services (in `src/services/`)
- `authService.js` - Authentication logic
- `employeeService.js` - Employee data management

### Styles (in `src/styles/`)
- `Auth.css` - Login/Register styling
- `Dashboard.css` - Dashboard styling
- `Profile.css` - Profile page styling
- `Modal.css` - Modal styling
- Plus index.css and App.css

### Config Files
- `package.json` - Dependencies and scripts
- `.gitignore` - Git ignore file
- `README.md` - Full documentation

---

## Testing the App

### Admin Features (Use: admin@example.com / admin123)
1. Login → See Admin Dashboard
2. View employee table
3. Click "Edit" → Modify employee details
4. Click "Delete" → Remove employee
5. Logout

### Employee Features (Use: emp@example.com / emp123)
1. Login → See Employee Dashboard
2. Click "View/Edit My Profile"
3. Click "Edit Profile"
4. Fill in your details:
   - Personal info (name, phone, position, etc.)
   - Address (city, state, zip)
   - Emergency contact
   - Skills
5. Click "Save Profile"
6. Logout

---

## Troubleshooting

**Issue: npm install fails**
- Make sure Node.js is installed: `node --version`
- Try clearing npm cache: `npm cache clean --force`
- Run `npm install` again

**Issue: Port 3000 already in use**
- The app will ask to use port 3001 instead - accept it
- Or close other apps using port 3000

**Issue: Page shows blank**
- Check browser console for errors (F12 or Right-click → Inspect)
- Try hard refresh (Ctrl+F5 or Cmd+Shift+R)

---

## Next Steps

### To Connect with Backend API:
1. Replace mock API calls in `src/services/authService.js` and `src/services/employeeService.js`
2. Update endpoints to your backend server
3. Handle authentication tokens from your backend

### To Customize:
1. Edit colors in CSS files (look for `#667eea` for main color)
2. Add more form fields in `src/pages/EmployeeProfile.js`
3. Modify table columns in `src/pages/AdminDashboard.js`

### To Add More Features:
1. Create new pages in `src/pages/`
2. Add routes in `src/App.js`
3. Create new services in `src/services/`
4. Add styles in `src/styles/`

---

## Support Resources

- React Docs: https://react.dev
- React Router: https://reactrouter.com
- CSS Tricks: https://css-tricks.com

Happy coding! 🚀
