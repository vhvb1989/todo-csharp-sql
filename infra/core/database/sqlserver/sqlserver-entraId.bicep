metadata description = 'Creates an Azure SQL Server instance with EntraId authentication only'
param name string
param location string = resourceGroup().location
param tags object = {}

@description('Name of the database to create')
param databaseName string

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
      principalType: principalType
      login: principalLogin
      sid: principalId
      tenantId: subscription().tenantId
      administratorType: 'ActiveDirectory'
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

output connectionString string = 'Server=${sqlServer.properties.fullyQualifiedDomainName};Initial Catalog=${sqlServer::database.name};Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;Authentication=Active Directory Default'
output databaseName string = sqlServer::database.name
output serverFqdn string = sqlServer.properties.fullyQualifiedDomainName
