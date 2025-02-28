import inquirer from 'inquirer'; // We need this for the CLI
import { pool, connectToDb } from './connection.js';
// I will use this to help me execute .sql files in the code.
import { readFileSync } from 'fs';
// I need this to *locate* the .sql files I want to execute
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Here, I need to figure out how to start my database...
await connectToDb();
class Cli {
    constructor(pool) {
        Object.defineProperty(this, "pool", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "db", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "schemaPath", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "seedsPath", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.pool = pool;
        this.db = false;
        this.schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
        this.seedsPath = path.join(__dirname, '..', 'db', 'seeds.sql');
    }
    async initDb() {
        console.log('GOT TO HERE');
        try {
            const schemaFile = readFileSync(this.schemaPath, 'utf8'); // Read SQL file content
            await pool.query(schemaFile); // Execute SQL
            console.log(`Initialized database schema!`);
            const seedsFile = readFileSync(this.seedsPath, 'utf8'); // Read SQL file content
            await pool.query(seedsFile); // Execute SQL
            console.log(`Initialized database seeds!`);
        }
        catch (err) {
            console.error(`Error executing ${path.basename(this.schemaPath)}:`, err);
        }
        this.db = true;
    }
    async mainMenu() {
        if (!this.db) {
            this.initDb();
        }
        const { option } = await inquirer.prompt([
            {
                type: 'list',
                message: 'What would you like to do?',
                name: 'option',
                choices: [
                    'View all departments',
                    'View all roles',
                    'View all employees',
                    'Add a department',
                    'Add a role',
                    'Add an employee',
                    'Update an employee'
                ],
            },
        ]);
        switch (option) {
            case 'View all departments':
                // Here, I need to figure out how to run an SQL command
                await this.viewAll('department');
                break;
            case 'View all roles':
                await this.viewAll('role');
                break;
            case 'View all employees':
                await this.viewAll('employee');
                break;
            case 'Add a department':
                await this.addDepartment();
                break;
            case 'Add a role':
                await this.addRole();
                break;
            default:
        }
        ;
        await inquirer.prompt([
            {
                type: 'input',
                name: 'continue',
                message: 'Press Enter to return to the menu...'
            },
        ]);
        this.mainMenu();
    }
    ;
    async viewAll(category) {
        // TODO: We would like our queries to be a bit more informative than what they are right now...
        let query = `SELECT * FROM ${category}`;
        if (category === 'role') {
            query = `
                SELECT  
                    role.id as id,
                    role.title as title,
                    role.salary as salary,
                    department.name as department
                FROM role 
                JOIN department ON role.department = department.id;`;
        }
        else if (category === 'employee') {
            query = `
                SELECT 
                    e1.first_name as first_name,
                    e1.last_name as last_name,
                    role.title as title,
                    role.salary as salary,
                    department.name as department,
                    e2.first_name as manager_first_name,
                    e2.last_name as manager_last_name
                FROM
                employee e1
                LEFT JOIN employee e2 ON e1.manager_id = e2.id
                JOIN role ON e1.role_id = role.id
                JOIN department ON role.department = department.id;
            `;
        }
        await this.pool.query(query, (err, result) => {
            if (err) {
                console.log(err);
            }
            else {
                console.log(result.rows);
            }
        });
    }
    async getDepartments() {
        const query = `SELECT * FROM department;`;
        let queryResult = [];
        const departments = [];
        await this.pool.query(query, (err, result) => {
            if (err) {
                console.log(`Error from getDepartments: ${err}`);
            }
            else {
                console.log(result.rows);
                queryResult = result.rows;
            }
        });
        for (let i = 0; i < queryResult.length; i++) {
            console.log(queryResult[i]);
            departments.push(queryResult[i].name);
        }
        return departments;
    }
    async addDepartment() {
        // Get the name of the new department
        const { deptName } = await inquirer.prompt([
            {
                type: 'input',
                name: 'deptName',
                message: 'Enter the name of the department:'
            },
        ]);
        // Run an SQL seed command to insert the new value.
        this.pool.query(`INSERT INTO department (name) VALUES ($1);`, [deptName], (err, _result) => {
            if (err) {
                console.log(err);
            }
            else {
                console.log(`New department ${deptName} successfully added!`);
            }
        });
    }
    ;
    async addRole() {
        // Get the name of the Role
        // const { roleName } = await inquirer.prompt([
        //     {
        //         type: 'input',
        //         name: 'roleName',
        //         message: 'Enter the name of the role:'
        //     },
        // ]);
        // const { roleSalary } = await inquirer.prompt([
        //     {
        //         type: 'input',
        //         name: 'roleSalary',
        //         message: 'Enter the role salary:'
        //     },
        // ]);
        // const { roleDepartment } = await inquirer.prompt([
        //     {
        //         type: 'list',
        //         name: 'roleDepartment',
        //         message: 'Which department does the role belong to?',
        //         choices: ['foo', 'goo']
        //     },
        // ]);
        const departmentList = await this.getDepartments();
        console.log(departmentList);
    }
    ;
    async addEmployee() {
    }
    ;
}
const cli = new Cli(pool);
cli.mainMenu();
//# sourceMappingURL=index.js.map