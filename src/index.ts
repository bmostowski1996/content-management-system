import inquirer from 'inquirer'; // We need this for the CLI

import { QueryResult } from 'pg';
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

    pool: any;
    db: boolean;
    schemaPath: string;
    seedsPath: string;

    constructor(pool: any) {
        this.pool = pool;
        this.db = false;
        this.schemaPath = path.join(__dirname, '..','db','schema.sql');
        this.seedsPath = path.join(__dirname, '..','db','seeds.sql');
    }

    async initDb(): Promise<void> {
        console.log('GOT TO HERE');
        try {
            const schemaFile = readFileSync(this.schemaPath, 'utf8'); // Read SQL file content
            await pool.query(schemaFile); // Execute SQL
            console.log(`Initialized database schema!`);

            const seedsFile = readFileSync(this.seedsPath, 'utf8'); // Read SQL file content
            await pool.query(seedsFile); // Execute SQL
            console.log(`Initialized database seeds!`);
        } catch (err) {
            console.error(`Error executing ${path.basename(this.schemaPath)}:`, err);
        }
        this.db = true;
    }

    async mainMenu(): Promise<void> {
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

        switch(option) {
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
            
            case 'Add an employee':
                await this.addEmployee();
                break;

            default:
        };

        await inquirer.prompt([
            {
                type: 'input',
                name: 'continue',
                message: 'Press Enter to return to the menu...'
            },
        ]);
        
        this.mainMenu();
    };

    async viewAll(category: string): Promise<void> {
        // TODO: We would like our queries to be a bit more informative than what they are right now...
        let query = `SELECT * FROM ${category}`;

        if (category === 'role') {
            query =`
                SELECT  
                    role.id as id,
                    role.title as title,
                    role.salary as salary,
                    department.name as department
                FROM role 
                JOIN department ON role.department = department.id;`
        } else if (category === 'employee') {
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
        } else {
            query =`SELECT * FROM ${category};`
        }

        await this.pool.query(query, (err: Error, result: QueryResult) => {
            if (err) {
              console.log(err);
            } else {
              console.log(result.rows);
            }
          });
    }

    private async getDepartments(): Promise<any[]> {

        const query = `SELECT * FROM department;`;

        try {
            const result = await this.pool.query(query);
            const returnVal = (result.rows as any[]).map(({ id, name }) => ({ value: id, name }));
            return returnVal;
        } catch(err) {
            console.log('Error getting departments!');
            return [];
        }
        
    }

    async addDepartment(): Promise<void> {

        // Get the name of the new department
        const { deptName } = await inquirer.prompt([
            {
                type: 'input',
                name: 'deptName',
                message: 'Enter the name of the department:'
            },
        ]);

        // Run an SQL seed command to insert the new value.
        this.pool.query(
            `INSERT INTO department (name) VALUES ($1);`, [deptName], 
            (err: Error, _result: QueryResult) => {
            if (err) {
              console.log(err);
            } else {
              console.log(`New department ${deptName} successfully added!`);
            }
        });

    };

    private async getRoles(): Promise<any[]> {

        const query = `SELECT id, title FROM role;`;

        try {
            const result = await this.pool.query(query);
            const returnVal = (result.rows as any[]).map(({ id, title }) => ({ value: id, name: title }));
            return returnVal;
        } catch(err) {
            console.log('Error getting roles!');
            return [];
        }
        
    }

    async addRole(): Promise<void> {

        // Get the name of the Role
        const { roleName } = await inquirer.prompt([
            {
                type: 'input',
                name: 'roleName',
                message: 'Enter the name of the role:'
            },
        ]);

        const { roleSalary } = await inquirer.prompt([
            {
                type: 'input',
                name: 'roleSalary',
                message: 'Enter the role salary:'
            },
        ]);

        const departmentInfo = await this.getDepartments();
        const { roleDepartment } = await inquirer.prompt([
            {
                type: 'list',
                name: 'roleDepartment',
                message: 'Which department does the role belong to?',
                choices: departmentInfo
            },
        ]);

        // Once we have everything, let's add our new role to the database
        this.pool.query(
            `INSERT INTO role (title, salary, department) VALUES ($1, $2, $3);`, [roleName, roleSalary, roleDepartment], 
            (err: Error, _result: QueryResult) => {
            if (err) {
              console.log(err);
            } else {
              console.log(`New role ${roleName} successfully added!`);
            }
        });
    };

    private async getEmployees(): Promise<any[]> {
        const query = `SELECT id, first_name, last_name FROM employee;`;

        try {
            const result = await this.pool.query(query);
            const returnVal = (result.rows as any[]).map(({ id, first_name, last_name }) => ({ value: id, name: first_name + ' ' + last_name }));
            return returnVal;
        } catch(err) {
            console.log('Error getting employees!');
            return [];
        }
    }

    async addEmployee(): Promise<void> {

        // Get the Employee's first name
        const { empFirstName } = await inquirer.prompt([
            {
                type: 'input',
                name: 'empFirstName',
                message: 'Enter the employee\'s first name:'
            },
        ]);

        // Get the Employee's last name
        const { empLastName } = await inquirer.prompt([
            {
                type: 'input',
                name: 'empLastName',
                message: 'Enter the employee\'s last name:'
            },
        ]);

        // Get the Employee's role
        const rolesInfo = await this.getRoles();
        const { empRole } = await inquirer.prompt([
            {
                type: 'list',
                name: 'empRole',
                message: 'Which role does the employee have?',
                choices: rolesInfo
            },
        ]);

        // Get the Employee's manager
        // Get the Employee's role
        const empInfo = await this.getEmployees();
        empInfo.push({value: null, name: 'No one'});

        const { empManager } = await inquirer.prompt([
            {
                type: 'list',
                name: 'empManager',
                message: 'Which role does the employee have?',
                choices: empInfo
            },
        ]);
        
        // Once we have everything, let's add our new employee to the database
        this.pool.query(
            `INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4);`, [empFirstName, empLastName, empRole, empManager], 
            (err: Error, _result: QueryResult) => {
            if (err) {
              console.log(err);
            } else {
              console.log(`New employee ${empFirstName} ${empLastName} successfully added!`);
            }
        });
    };
}

const cli = new Cli(pool);
cli.mainMenu();
