DO $$
    DECLARE
        -- We don't need to declare any special values here
    BEGIN

    INSERT INTO department (name) 
    VALUES
        ('Front-end'),
        ('Back-end');

    INSERT INTO role (title, salary, department) 
    VALUES
        ('Frontend Programmer', 60000, 1),
        ('UI Design', 50000, 1),
        ('Backend Programmer', 60000, 2),
        ('Architecture Design', 50000, 2);

    INSERT INTO employee (first_name, last_name, role_id, manager_id)
    VALUES
        ('Joe', 'Schmoe', 1, NULL),
        ('Bubba', 'Dixon', 2, 1),
        ('Al', 'Bundy', 3, 1),
        ('Action', 'Jackson', 4, 1);

RAISE NOTICE 'TRANSACTION COMPLETE';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'An error occurred: %', SQLERRM; -- Log the error
        ROLLBACK; -- Explicitly roll back changes in case of error
END $$;