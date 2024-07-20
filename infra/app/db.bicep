param name string
param location string = resourceGroup().location
param tags object = {}

param databaseName string = ''

// Because databaseName is optional in main.bicep, we make sure the database name is set here.
var defaultDatabaseName = 'Todo'
var actualDatabaseName = !empty(databaseName) ? databaseName : defaultDatabaseName

@description('Login of the principal to assign the role to. Use email for User or Application Name for Application')
param principalLogin string

@description('Object Id of the EntraId user for login')
param principalId string

@description('Type of the principal to assign the role to')
@allowed([
  'User'
  'Application'
  'Group'
])
param principalType string

module sqlServer '../core/database/sqlserver/sqlserver-entraId.bicep' = {
  name: 'sqlserver'
  params: {
    name: name
    location: location
    tags: tags
    databaseName: actualDatabaseName
    principalId: principalId
    principalLogin: principalLogin
    principalType: principalType
  }
}

output connectionString string = sqlServer.outputs.connectionString
output serverFqdn string = sqlServer.outputs.serverFqdn
output databaseName string = sqlServer.outputs.databaseName
