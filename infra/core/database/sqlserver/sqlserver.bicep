metadata description = 'Creates an Azure SQL Server instance.'
param name string
param location string = resourceGroup().location
param tags object = {}

//param appUser string = 'appUser'
param databaseName string
param connectionStringKey string = 'AZURE-SQL-CONNECTION-STRING'

param principalId string

resource sqlServer 'Microsoft.Sql/servers@2023-08-01-preview' = {
  name: name
  location: location
  tags: tags
  properties: {
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
    primaryUserAssignedIdentityId: principalId
    administrators: {
      azureADOnlyAuthentication: true
      principalType: 'User'
      login: 'vivazqu@microsoft.com'
      sid: principalId
      tenantId: subscription().tenantId
    }
  }

  resource database 'databases' = {
    name: databaseName
    location: location
  }

  resource firewall 'firewallRules' = {
    name: 'Azure Services'
    properties: {
      // Allow all clients
      // Note: range [0.0.0.0-0.0.0.0] means "allow all Azure-hosted clients only".
      // This is not sufficient, because we also want to allow direct access from developer machine, for debugging purposes.
      startIpAddress: '0.0.0.1'
      endIpAddress: '255.255.255.254'
    }
  }
}

// resource sqlDeploymentScript 'Microsoft.Resources/deploymentScripts@2020-10-01' = {
//   name: '${name}-deployment-script'
//   location: location
//   kind: 'AzureCLI'
//   properties: {
//     azCliVersion: '2.37.0'
//     retentionInterval: 'PT1H' // Retain the script resource for 1 hour after it ends running
//     timeout: 'PT5M' // Five minutes
//     cleanupPreference: 'OnSuccess'
//     environmentVariables: [
//       {
//         name: 'APPUSERNAME'
//         value: appUser
//       }
//       {
//         name: 'DBNAME'
//         value: databaseName
//       }
//       {
//         name: 'DBSERVER'
//         value: sqlServer.properties.fullyQualifiedDomainName
//       }
//     ]

//     scriptContent: '''
// wget https://github.com/microsoft/go-sqlcmd/releases/download/v0.8.1/sqlcmd-v0.8.1-linux-x64.tar.bz2
// tar x -f sqlcmd-v0.8.1-linux-x64.tar.bz2 -C .

// cat <<SCRIPT_END > ./initDb.sql
// drop user if exists ${APPUSERNAME}
// go
// create user ${APPUSERNAME} with password = '${APPUSERPASSWORD}'
// go
// alter role db_owner add member ${APPUSERNAME}
// go
// SCRIPT_END

// ./sqlcmd -S ${DBSERVER} -d ${DBNAME} -U ${SQLADMIN} -i ./initDb.sql
//     '''
//   }
// }

//var connectionString = 'Server=${sqlServer.properties.fullyQualifiedDomainName}; Database=${sqlServer::database.name}; User=${appUser}'
output connectionStringKey string = connectionStringKey
output databaseName string = sqlServer::database.name
