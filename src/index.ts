import inquirer from 'inquirer'; // We need this for the CLI

import { QueryResult } from 'pg';
import { pool, connectToDb } from './connection.js';

// I will use this to help me execute .sql files in the code.
import { readFileSync } from 'fs';

import path from 'path';

// Here, I need to figure out how to start my database...
await connectToDb();

class Cli {

    pool: any;

    constructor(pool: any) {
        this.pool = pool;
    }

    async initDb(): Promise<void> {
        try {
            const sql = readFileSync(filePath, 'utf8'); // Read SQL file content
            await pool.query(sql); // Execute SQL
            console.log(`Executed: ${path.basename(filePath)}`);
        } catch (err) {
            console.error(`Error executing ${path.basename(filePath)}:`, err);
        }
    }

    async mainMenu(): Promise<void> {
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
                this.viewAll('department');
                break;
    
            case 'View all roles':
                this.viewAll('role');
                break;
            
            case 'View all employees':
                this.viewAll('employee');
                break;

            case 'Add a department':
                await this.addDepartment();
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

    viewAll(category: string): void {
        // TODO: We would like our queries to be a bit more informative than what they are right now...
        let query = `SELECT * FROM ${category}`;

        if (category === 'role') {
            query =`
                SELECT  
                    role.id as id,
                    role.title as title,
                    role.salary as salary,
                    department.name as department,
                    e2.first_name as manager_first_name,
                    e2.last_name as manager_last_name
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
                    e2.id as id
                FROM
                employee e1
                LEFT JOIN employee e2 ON e1.manager_id = e2.id
                JOIN role ON e1.role_id = role.id
                JOIN department ON role.department = department.id;
            `

            // query = `
            //     SELECT 
            //         e1.first_name as first_name,
            //         e1.last_name as last_name,
            //         e1.manager_id as manager_id,
            //         e2.id as id
            //     FROM
            //     employee e1
            //     LEFT JOIN employee e2 ON e1.manager_id = e2.id;
            // `
        }

        this.pool.query(query, (err: Error, result: QueryResult) => {
            if (err) {
              console.log(err);
            } else {
              console.log(result.rows);
            }
          });
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

    async addRole(): Promise<void> {

    };

    async addEmployee(): Promise<void> {

    };
}

const cli = new Cli(pool);
cli.mainMenu();
