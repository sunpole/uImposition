param(
    [string]$Root = $HOME,
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$Source = Join-Path $RepoRoot '.agent-vendor/mattpocock-skills'
$ExpectedCommit = '2ab958093e83e0ec752e6c1c5932da465bf23e0c'

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw 'git is required.'
}

if (-not (Test-Path (Join-Path $Source '.git'))) {
    & git -C $RepoRoot submodule update --init --recursive .agent-vendor/mattpocock-skills
    if ($LASTEXITCODE -ne 0) { throw 'Failed to initialise the skills submodule.' }
}

$ActualCommit = (& git -C $Source rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Failed to read the skills commit.' }
if ($ActualCommit -ne $ExpectedCommit) {
    throw "Unexpected skills commit. Expected $ExpectedCommit, actual $ActualCommit. Update the pin intentionally before installing."
}

$SkillDirectories = Get-ChildItem -Path (Join-Path $Source 'skills') -Recurse -File -Filter 'SKILL.md' |
    Where-Object { $_.FullName -notmatch '[\\/]deprecated[\\/]' } |
    ForEach-Object { $_.Directory.FullName } |
    Sort-Object -Unique

if (-not $SkillDirectories -or $SkillDirectories.Count -eq 0) {
    throw 'No installable skills were found.'
}

function Install-SkillsInto {
    param([Parameter(Mandatory = $true)][string]$Destination)

    New-Item -ItemType Directory -Force -Path $Destination | Out-Null
    $Manifest = Join-Path $Destination '.matt-pocock-skills-uimposition'
    $Previous = @()

    if (Test-Path $Manifest) {
        $Lines = Get-Content $Manifest
        if ($Lines.Count -gt 1) { $Previous = $Lines[1..($Lines.Count - 1)] }
    }

    $Names = $SkillDirectories | ForEach-Object { Split-Path $_ -Leaf }

    foreach ($Name in $Names) {
        $Target = Join-Path $Destination $Name
        if ((Test-Path $Target) -and ($Previous -notcontains $Name) -and (-not $Force)) {
            throw "Unmanaged skill already exists: $Target. Re-run with -Force only if replacing it is intentional."
        }
    }

    foreach ($OldName in $Previous) {
        if ([string]::IsNullOrWhiteSpace($OldName)) { continue }
        $OldTarget = Join-Path $Destination $OldName
        if (Test-Path $OldTarget) { Remove-Item -Recurse -Force $OldTarget }
    }

    foreach ($SkillDirectory in $SkillDirectories) {
        $Name = Split-Path $SkillDirectory -Leaf
        $Target = Join-Path $Destination $Name
        if (Test-Path $Target) { Remove-Item -Recurse -Force $Target }
        Copy-Item -Recurse -Force $SkillDirectory $Target
    }

    @("source=$ExpectedCommit") + ($Names | Sort-Object -Unique) |
        Set-Content -Encoding utf8 $Manifest

    Write-Host "installed $($Names.Count) skills into $Destination"
}

Install-SkillsInto (Join-Path $Root '.agents/skills')
Install-SkillsInto (Join-Path $Root '.claude/skills')

Write-Host "Matt Pocock skills are installed from pinned commit $ExpectedCommit."
Write-Host 'Restart Codex/Claude Code so the skill index is refreshed.'
