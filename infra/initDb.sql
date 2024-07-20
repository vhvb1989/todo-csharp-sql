IF NOT EXISTS (SELECT name FROM master.sys.server_principals WHERE name = '${SQL_USER_LOGIN}')
BEGIN
    -- Create a login for use in Azure Active Directory
    CREATE LOGIN [${SQL_USER_LOGIN}] FROM EXTERNAL PROVIDER WITH OBJECT_ID = '${SQL_USER_LOGIN_ID}';
END
