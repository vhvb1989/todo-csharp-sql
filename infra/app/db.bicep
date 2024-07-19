param name string
param location string = resourceGroup().location
param tags object = {}

param databaseName string = ''

// Because databaseName is optional in main.bicep, we make sure the database name is set here.
var defaultDatabaseName = 'Todo'
var actualDatabaseName = !empty(databaseName) ? databaseName : defaultDatabaseName

param principalId string

module sqlServer '../core/database/sqlserver/sqlserver.bicep' = {
  name: 'sqlserver'
  params: {
    name: name
    location: location
    tags: tags
    databaseName: actualDatabaseName
    principalId: principalId
  }
}

output connectionStringKey string = sqlServer.outputs.connectionStringKey
output databaseName string = sqlServer.outputs.databaseName
