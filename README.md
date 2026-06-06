# Employee Management System

A modern React.js-based Employee Management System with role-based access control, authentication, and comprehensive employee profile management.

## Features

### 🔐 Authentication & Authorization
- **User Registration**: Create new user accounts with role selection (Admin/Employee)
- **Login System**: Secure login with email and password
- **Role-Based Access Control**: Different features for Admin and Employee roles
- **Session Persistence**: Login state persists across page refreshes

### 👨‍💼 Admin Features
- View all employees in a comprehensive table
- **Edit Employee Details**: Modify any employee's information
- **Delete Employees**: Remove employees from the system
- Manage employee profiles and information

### 👥 Employee Features
- **View Personal Profile**: See your profile information
- **Edit Profile**: Update personal details including:
  - Personal information (name, email, phone)
  - Employment details (position, department, hire date)
  - Address information (street, city, state, zip)
  - Emergency contact details
  - Skills and competencies
- **Save Changes**: Persist profile updates to the system

## Project Structure

```
employee-management/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   └── EmployeeEditModal.js
│   ├── pages/
│   │   ├── AdminDashboard.js
│   │   ├── EmployeeDashboard.js
│   │   ├── EmployeeProfile.js
│   │   ├── Login.js
│   │   └── Register.js
│   ├── services/
│   │   ├── authService.js
│   │   └── employeeService.js
│   ├── styles/
│   │   ├── Auth.css
│   │   ├── Dashboard.css
│   │   ├── Modal.css
│   │   └── Profile.css
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── package.json
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Steps

1. **Navigate to project directory**
   ```bash
   cd "employee management"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open in browser**
   - The application will automatically open at `http://localhost:3000`
   - If not, manually navigate to that URL

## Demo Credentials

Use these credentials to test the application:

### Admin Account
- **Email**: admin@example.com
- **Password**: admin123

### Employee Account
- **Email**: emp@example.com
- **Password**: emp123

## Usage Guide

### For Admins

1. **Login as Admin**
   - Navigate to login page
   - Enter admin credentials
   - Click "Login"

2. **View All Employees**
   - You'll see the Admin Dashboard with a table of all employees
   - Table displays: ID, Name, Email, Position, Department, Phone

3. **Edit Employee**
   - Click the "Edit" button in the Actions column
   - Modify employee details in the modal
   - Click "Save Changes"

4. **Delete Employee**
   - Click the "Delete" button in the Actions column
   - Confirm the deletion
   - Employee will be removed from the system

5. **Logout**
   - Click the "Logout" button in the header

### For Employees

1. **Create Account (Optional)**
   - Click "Register here" on login page
   - Fill in registration form (select "Employee" role)
   - Click "Register"

2. **Login**
   - Enter your email and password
   - Click "Login"

3. **View Dashboard**
   - See welcome message with Employee ID
   - Click "View/Edit My Profile" button

4. **Edit Profile**
   - Click "Edit Profile" button
   - Fill in all available fields:
     - Personal: Name, Email, Phone, Position, Department, Hire Date
     - Address: Street, City, State, Zip Code
     - Emergency: Contact Name and Phone
     - Skills: Your competencies (comma-separated)
   - Click "Save Profile"

5. **Logout**
   - Click "Logout" button in the header

## Features in Detail

### Profile Management
- Complete employee profile with multiple sections
- Edit mode toggles between view and edit states
- Real-time validation of input fields
- Success/error messages for save operations

### Admin Controls
- Modal-based editing for quick updates
- Confirmation dialogs for destructive actions
- Table view for easy employee browsing
- Action buttons for quick access

### Responsive Design
- Mobile-friendly interface
- Adaptive layouts for different screen sizes
- Touch-friendly buttons and controls

## Technologies Used

- **React 18**: UI library
- **React Router 6**: Navigation and routing
- **CSS3**: Styling with modern features
- **Local Storage**: Session persistence
- **Mock API**: Client-side data management

## Future Enhancements

- Backend API integration
- Database persistence
- Advanced search and filtering
- Employee performance reviews
- Leave management system
- Salary management
- Export to PDF/Excel
- Email notifications
- User profile pictures
- Department management

## Available Scripts

### `npm start`
Runs the app in development mode at http://localhost:3000

### `npm build`
Builds the app for production to the `build` folder

### `npm test`
Launches the test runner in interactive watch mode

## Notes

- This application uses mock data stored in the browser's memory
- Data persists during the session but will reset when the browser is refreshed (except for login state which uses localStorage)
- For production use, integrate with a backend API and database

## Support

For issues or questions, please refer to the React documentation or React Router documentation:
- [React Documentation](https://react.dev)
- [React Router Documentation](https://reactrouter.com)

## License

MIT License - Feel free to use this project as a template for your own applications.
