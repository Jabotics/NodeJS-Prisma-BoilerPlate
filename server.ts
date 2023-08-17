// Imported modules
import { Request, Response } from 'express';

// middleware
import PermissionManager from './middleware/permissionManager';
import AuthenticationManager from './middleware/authenticationManager';

// Custom modules
import roleAPIs from './APIs/roleAPI';
import settingAPIs from './APIs/settingsAPI';
import employeeAPIs from './APIs/employeeAPI';
import authenticationAPIs from "./APIs/authenticationAPI";
import permissionComponentAPIs from "./APIs/permissionComponentAPI";

// Schedule Jobs
import scheduler from './scheduler';

// Express framework and REST API
const fs = require('fs');
const cors = require("cors");
const PORT = process.env.PORT;
// const https = require('https');
const express = require('express');
const multer = require("multer");
const multipartDataHandler = multer().any()
const path = require('path')


// Creating express and swagger instance
const app = express();
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const customCss = fs.readFileSync((process.cwd()+"/swagger.css"), 'utf8');

const swaggerOptions = {
    explorer: true,
    customCss: customCss,
    swaggerOptions: {
        persistAuthorization: true,
        tryItOutEnabled: true,
        docExpansion: "none",
        tagsSorter: "alpha",
        operationsSorter: "alpha"
    }
}

// Scheduler
const cron = require('node-cron');
cron.schedule("0 10 0 * * * *", async() => scheduler.remove_blacklist_token());
cron.schedule("0 20 0 * * * *", async() => scheduler.remove_verification_token());
cron.schedule("0 30 * * * * *", async() => scheduler.remove_blacklist_ip_addresses());

// Configurations
app.use(express.json());                                                                    // for parsing application/json
app.use(express.urlencoded({ extended: true }));                                            // for parsing application/x-www-form-urlencoded
app.use(multipartDataHandler);                                                              // for parsing multipart/form-data
app.use(cors({origin: process.env.ORIGIN}));                                                // cross origin resource sharing policy
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));    // swagger docs
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));                       // file server

// Authentication API
app.post("/api/login", async(req: Request, res: Response) => authenticationAPIs.login(req, res));
app.get("/api/find-my-ip", async(req: Request, res: Response) => authenticationAPIs.find_my_ip(req, res));
app.post("/api/reset-email", async(req: Request, res: Response) => authenticationAPIs.reset_email(req, res));
app.post("/api/reset-password", async(req: Request, res: Response) => authenticationAPIs.reset_password(req, res));
app.post("/api/forget-password", async(req: Request, res: Response) => authenticationAPIs.forget_password(req, res));
app.post("/api/user-registration", async(req: Request, res: Response) => authenticationAPIs.user_registration(req, res));
app.post("/api/generate-password", async(req: Request, res: Response) => authenticationAPIs.generate_password(req, res));
app.post("/api/employee-registration", async(req: Request, res: Response) => authenticationAPIs.employee_registration(req, res));
app.post("/api/logout", [AuthenticationManager.verifyJWT], async(req: Request, res: Response) => authenticationAPIs.logout(req, res));
app.post("/api/verify-session", [AuthenticationManager.verifyJWT], async(req: Request, res: Response) => authenticationAPIs.verify_session(req, res));

// Employee API
app.post("/api/add-employees", [AuthenticationManager.verifyJWT, PermissionManager.add(PermissionManager.types.employees)], async(req: Request, res: Response) => employeeAPIs.add_employees(req, res));
app.get("/api/view-employees", [AuthenticationManager.verifyJWT, PermissionManager.view(PermissionManager.types.employees)], async(req: Request, res: Response) => employeeAPIs.view_employees(req, res));
app.post("/api/update-employee", [AuthenticationManager.verifyJWT, PermissionManager.update(PermissionManager.types.employees)], async(req: Request, res: Response) => employeeAPIs.update_employee(req, res));
app.post("/api/remove-employees", [AuthenticationManager.verifyJWT, PermissionManager.remove(PermissionManager.types.employees)], async(req: Request, res: Response) => employeeAPIs.remove_employees(req, res));

// Permission Components
app.get("/api/view-permission-components", [AuthenticationManager.verifyJWT, PermissionManager.staff], async(req: Request, res: Response) => permissionComponentAPIs.view_permission_components(req, res));
app.post("/api/add-permission-component", [AuthenticationManager.verifyJWT, PermissionManager.superAdmin], async(req: Request, res: Response) => permissionComponentAPIs.add_permission_component(req, res));
app.post("/api/remove-permission-component", [AuthenticationManager.verifyJWT, PermissionManager.superAdmin], async(req: Request, res: Response) => permissionComponentAPIs.remove_permission_component(req, res));
app.post("/api/update-permission-component", [AuthenticationManager.verifyJWT, PermissionManager.superAdmin], async(req: Request, res: Response) => permissionComponentAPIs.update_permission_component(req, res));

// Roles
app.post("/api/add-role", [AuthenticationManager.verifyJWT, PermissionManager.add(PermissionManager.types.roles)], async(req: Request, res: Response) => roleAPIs.add_role(req, res));
app.get("/api/view-roles", [AuthenticationManager.verifyJWT, PermissionManager.view(PermissionManager.types.roles)], async(req: Request, res: Response) => roleAPIs.view_roles(req, res));
app.post("/api/update-role", [AuthenticationManager.verifyJWT, PermissionManager.update(PermissionManager.types.roles)], async(req: Request, res: Response) => roleAPIs.update_role(req, res));
app.post("/api/remove-roles", [AuthenticationManager.verifyJWT, PermissionManager.remove(PermissionManager.types.roles)], async(req: Request, res: Response) => roleAPIs.remove_roles(req, res));

// Settings
app.post("/api/update-self", [AuthenticationManager.verifyJWT], async(req: Request, res: Response) => settingAPIs.update_self(req, res));
app.post("/api/update-email", [AuthenticationManager.verifyJWT], async(req: Request, res: Response) => settingAPIs.update_email(req, res));
app.post("/api/update-password", [AuthenticationManager.verifyJWT], async(req: Request, res: Response) => settingAPIs.update_password(req, res));

// Serving on port from environment files
// const httpsServer = https.createServer({
//     "key": fs.readFileSync((process.cwd()+"/SSL/key.pem"), 'utf8'), 
//     "cert": fs.readFileSync((process.cwd()+"/SSL/server.pem"), 'utf8')
// }, app);

// httpsServer.listen(PORT, () => {
//     console.log(`[+] Server listening on the port :: ${PORT}\n`);
// });

app.listen(PORT, () => {
    console.log(`[+] Server listening on the port :: ${PORT}\n`);
});