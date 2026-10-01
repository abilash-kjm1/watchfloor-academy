/* Validates every KQL query in the academy with Microsoft's Kusto.Language parser
 * against table schemas taken from Microsoft Learn reference pages (2026-10-01).
 * Usage: node audit/kql-check.cjs            (reads audit/inventory.json)
 */
const path = require('path')
const fs = require('fs')
const dir = path.join(__dirname, 'node_modules/@kusto/language-service-next')
require(path.join(dir, 'bridge.js'))
require(path.join(dir, 'Kusto.Language.Bridge.js'))
const K = global.Kusto.Language

// Verified against Microsoft Learn table references (full lists for these tables, trimmed of internal _ columns).
const VERIFIED = {
  SigninLogs: 'TimeGenerated:datetime, UserPrincipalName:string, UserDisplayName:string, UserId:string, IPAddress:string, Location:string, LocationDetails:dynamic, AppDisplayName:string, AppId:string, ResultType:string, ResultDescription:string, ResultSignature:string, ClientAppUsed:string, DeviceDetail:dynamic, AuthenticationRequirement:string, AuthenticationDetails:string, ConditionalAccessStatus:string, ConditionalAccessPolicies:dynamic, RiskLevelDuringSignIn:string, RiskLevelAggregated:string, RiskState:string, RiskEventTypes_V2:string, UserAgent:string, IsInteractive:bool, IsRisky:bool, CorrelationId:string, SessionId:string, Status:dynamic, OperationName:string, Category:string, ResourceDisplayName:string, AutonomousSystemNumber:string, CreatedDateTime:datetime, Type:string',
  SecurityEvent: 'TimeGenerated:datetime, Computer:string, EventID:int, Activity:string, Account:string, AccountType:string, AccountName:string, AccountDomain:string, LogonType:int, LogonTypeName:string, IpAddress:string, IpPort:string, WorkstationName:string, TargetUserName:string, TargetDomainName:string, TargetAccount:string, TargetLogonId:string, SubjectUserName:string, SubjectDomainName:string, SubjectLogonId:string, SubjectAccount:string, NewProcessName:string, NewProcessId:string, CommandLine:string, ParentProcessName:string, ProcessName:string, Status:string, SubStatus:string, FailureReason:string, LogonProcessName:string, AuthenticationPackageName:string, PrivilegeList:string, MemberName:string, MemberSid:string, ServiceName:string, ServiceFileName:string, EventData:string, Channel:string, Process:string, LogonID:string, UserPrincipalName:string, TargetUserSid:string, ElevatedToken:string, Type:string',
  DeviceProcessEvents: 'Timestamp:datetime, DeviceId:string, DeviceName:string, ActionType:string, FileName:string, FolderPath:string, SHA1:string, SHA256:string, MD5:string, FileSize:long, ProcessVersionInfoCompanyName:string, ProcessId:long, ProcessCommandLine:string, ProcessIntegrityLevel:string, ProcessTokenElevation:string, ProcessCreationTime:datetime, AccountDomain:string, AccountName:string, AccountSid:string, AccountUpn:string, AccountObjectId:string, LogonId:long, InitiatingProcessAccountDomain:string, InitiatingProcessAccountName:string, InitiatingProcessAccountSid:string, InitiatingProcessAccountUpn:string, InitiatingProcessAccountObjectId:string, InitiatingProcessSHA1:string, InitiatingProcessSHA256:string, InitiatingProcessMD5:string, InitiatingProcessFileName:string, InitiatingProcessId:long, InitiatingProcessCommandLine:string, InitiatingProcessCreationTime:datetime, InitiatingProcessFolderPath:string, InitiatingProcessParentId:long, InitiatingProcessParentFileName:string, InitiatingProcessSignerType:string, InitiatingProcessSignatureStatus:string, ReportId:long, AdditionalFields:string',
  DeviceNetworkEvents: 'Timestamp:datetime, DeviceId:string, DeviceName:string, ActionType:string, RemoteIP:string, RemotePort:int, RemoteUrl:string, LocalIP:string, LocalPort:int, Protocol:string, LocalIPType:string, RemoteIPType:string, InitiatingProcessSHA1:string, InitiatingProcessSHA256:string, InitiatingProcessMD5:string, InitiatingProcessFileName:string, InitiatingProcessId:long, InitiatingProcessCommandLine:string, InitiatingProcessCreationTime:datetime, InitiatingProcessFolderPath:string, InitiatingProcessParentFileName:string, InitiatingProcessAccountDomain:string, InitiatingProcessAccountName:string, InitiatingProcessAccountUpn:string, ReportId:long, AdditionalFields:string',
  DeviceFileEvents: 'Timestamp:datetime, DeviceId:string, DeviceName:string, ActionType:string, FileName:string, FolderPath:string, SHA1:string, SHA256:string, MD5:string, FileOriginUrl:string, FileOriginReferrerUrl:string, FileOriginIP:string, PreviousFolderPath:string, PreviousFileName:string, FileSize:long, InitiatingProcessAccountName:string, InitiatingProcessSHA1:string, InitiatingProcessFileName:string, InitiatingProcessCommandLine:string, InitiatingProcessFolderPath:string, ReportId:long, AdditionalFields:string',
  EmailEvents: 'Timestamp:datetime, NetworkMessageId:string, InternetMessageId:string, SenderMailFromAddress:string, SenderFromAddress:string, SenderDisplayName:string, SenderMailFromDomain:string, SenderFromDomain:string, SenderIPv4:string, RecipientEmailAddress:string, Subject:string, EmailDirection:string, DeliveryAction:string, DeliveryLocation:string, ThreatTypes:string, ThreatNames:string, DetectionMethods:string, AuthenticationDetails:string, AttachmentCount:int, UrlCount:int, ReportId:string, AdditionalFields:string, LatestDeliveryLocation:string, LatestDeliveryAction:string',
  EmailUrlInfo: 'Timestamp:datetime, NetworkMessageId:string, Url:string, UrlDomain:string, UrlLocation:string, ReportId:string',
  UrlClickEvents: 'Timestamp:datetime, Url:string, ActionType:string, AccountUpn:string, Workload:string, NetworkMessageId:string, ThreatTypes:string, DetectionMethods:string, IPAddress:string, IsClickedThrough:bool, UrlChain:string, ReportId:string, TimeGenerated:datetime',
  AlertInfo: 'Timestamp:datetime, AlertId:string, Title:string, Category:string, Severity:string, ServiceSource:string, DetectionSource:string, AttackTechniques:string',
  AlertEvidence: 'Timestamp:datetime, AlertId:string, Title:string, Categories:string, AttackTechniques:string, ServiceSource:string, DetectionSource:string, EntityType:string, EvidenceRole:string, FileName:string, FolderPath:string, SHA1:string, SHA256:string, RemoteIP:string, RemoteUrl:string, AccountName:string, AccountUpn:string, DeviceId:string, DeviceName:string, NetworkMessageId:string, ProcessCommandLine:string, Severity:string, AdditionalFields:string',
  SentinelAudit: 'TimeGenerated:datetime, OperationName:string, SentinelResourceName:string, SentinelResourceType:string, SentinelResourceKind:string, SentinelResourceId:string, Status:string, Description:string, ExtendedProperties:dynamic, CorrelationId:string, WorkspaceId:string',
  DnsEvents: 'TimeGenerated:datetime, Computer:string, ClientIP:string, Name:string, QueryType:string, IPAddresses:string, Result:string, ResultCode:int, EventId:int, SubType:string, MaliciousIP:string, IndicatorThreatType:string, Message:string',
  ASimDnsActivityLogs: 'TimeGenerated:datetime, EventResult:string, EventResultDetails:string, EventOriginalType:string, DnsQuery:string, DnsQueryType:int, DnsQueryTypeName:string, DnsResponseCodeName:string, SrcIpAddr:string, SrcPortNumber:int, DvcIpAddr:string, DnsSessionId:string, Dvc:string',
  Usage: 'TimeGenerated:datetime, DataType:string, Quantity:real, QuantityUnit:string, IsBillable:bool, Solution:string, StartTime:datetime, EndTime:datetime, Plan:string',
  SecurityAlert: 'TimeGenerated:datetime, AlertName:string, AlertSeverity:string, AlertType:string, CompromisedEntity:string, ConfidenceLevel:string, Description:string, DisplayName:string, Entities:string, ExtendedProperties:string, IsIncident:bool, ProductName:string, ProviderName:string, Status:string, SystemAlertId:string, Tactics:string, Techniques:string, SubTechniques:string, VendorName:string, StartTime:datetime, EndTime:datetime',
}
// Well-known schemas not re-fetched this pass (lower confidence; flagged separately in the report).
const KNOWN = {
  AADNonInteractiveUserSignInLogs: VERIFIED.SigninLogs,
  Syslog: 'TimeGenerated:datetime, Computer:string, HostName:string, HostIP:string, Facility:string, SeverityLevel:string, ProcessName:string, ProcessID:int, SyslogMessage:string, Type:string',
  Event: 'TimeGenerated:datetime, Source:string, EventLog:string, Computer:string, EventLevel:int, EventLevelName:string, EventID:int, RenderedDescription:string, ParameterXml:string, EventData:string, UserName:string, Type:string',
  AuditLogs: 'TimeGenerated:datetime, OperationName:string, Category:string, Result:string, ResultReason:string, InitiatedBy:dynamic, TargetResources:dynamic, AdditionalDetails:dynamic, LoggedByService:string, CorrelationId:string, Type:string',
  SecurityIncident: 'TimeGenerated:datetime, IncidentNumber:int, IncidentName:string, Title:string, Description:string, Severity:string, Status:string, Classification:string, ClassificationReason:string, Owner:dynamic, AlertIds:dynamic, ProviderName:string, CreatedTime:datetime, ClosedTime:datetime, Type:string',
  CommonSecurityLog: 'TimeGenerated:datetime, DeviceVendor:string, DeviceProduct:string, Activity:string, SourceIP:string, DestinationIP:string, DestinationPort:int, Protocol:string, DeviceAction:string, SentBytes:long, ReceivedBytes:long, RequestURL:string, Type:string',
}

const tables = { ...VERIFIED, ...KNOWN }
const symbols = Object.entries(tables).map(([n, s]) => new K.Symbols.TableSymbol.$ctor7(n, `(${s})`, null))
// _GetWatchlist is a Sentinel function; declare it as returning a generic table.
const watch = new K.Symbols.FunctionSymbol.$ctor5('_GetWatchlist', new K.Symbols.TableSymbol.$ctor7('wl', '(SearchKey:string, WatchlistItem:dynamic)', null), [new K.Symbols.Parameter.$ctor2('alias', K.Symbols.ScalarTypes.String)])
const db = new K.Symbols.DatabaseSymbol.ctor('SecurityWorkspace', [...symbols, watch])
const cluster = new K.Symbols.ClusterSymbol.ctor('lab', [db])
const globals = K.GlobalState.Default.WithCluster(cluster).WithDatabase(db)

function check(query) {
  const code = K.KustoCode.ParseAndAnalyze(query, globals)
  const diags = code.GetDiagnostics()
  const out = []
  for (let i = 0; i < diags.Count; i++) {
    const d = diags.getItem(i)
    out.push(`${d.Severity}: ${d.Message} @${d.Start} «${query.slice(d.Start, d.Start + Math.max(d.Length, 1)).replace(/\n/g, ' ')}»`)
  }
  return out
}

if (require.main === module) {
  const inv = JSON.parse(fs.readFileSync(path.join(__dirname, 'inventory.json'), 'utf8'))
  let bad = 0
  for (const q of inv.queries) {
    const issues = check(q.query)
    const unknownTable = Object.keys(KNOWN).some(t => new RegExp(`\\b${t}\\b`).test(q.query))
    if (issues.length) { bad++; console.log(`\n✗ ${q.where}${unknownTable ? '  [uses unverified schema]' : ''}\n  ${issues.join('\n  ')}`) }
  }
  console.log(`\n${inv.queries.length - bad}/${inv.queries.length} queries pass Kusto.Language analysis.`)
}
module.exports = { check }
