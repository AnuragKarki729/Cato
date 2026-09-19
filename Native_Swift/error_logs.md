##Crash Error:

-------------------------------------
Translated Report (Full Report Below)
-------------------------------------
Process:             CatoNative [51424]
Path:                /Users/USER/Library/Developer/CoreSimulator/Devices/7383ACFE-1671-4BEF-87DA-5834D2725987/data/Containers/Bundle/Application/5E441B0F-3133-4583-B72D-0CEAFA011F28/CatoNative.app/CatoNative
Identifier:          com.anuragkarki.cato.native
Version:             0.1.0 (1)
Code Type:           ARM-64 (Native)
Role:                Foreground
Parent Process:      launchd_sim [49252]
Coalition:           com.apple.CoreSimulator.SimDevice.7383ACFE-1671-4BEF-87DA-5834D2725987 [1931]
Responsible Process: SimulatorTrampoline [48084]
User ID:             501

Date/Time:           2026-09-17 11:21:13.4114 +0700
Launch Time:         2026-09-17 11:21:13.3448 +0700
Hardware Model:      Mac16,11
OS Version:          macOS 26.2 (25C56)
Release Type:        User

Crash Reporter Key:  765BA742-505C-0910-9661-3C2B17ABE395
Incident Identifier: BF94CF02-0CE9-40CD-A9A2-FF82754AECC6

Time Awake Since Boot: 4100 seconds

System Integrity Protection: enabled

Triggered by Thread: 0

Exception Type:    EXC_CRASH (SIGABRT)
Exception Codes:   0x0000000000000000, 0x0000000000000000

Termination Reason:  Namespace DYLD, Code 1, Library missing
Library not loaded: /Library/Frameworks/CatoNativeCore.framework/CatoNativeCore
Referenced from: <B9423539-BA6D-3C7D-95E8-18291166229C> /Users/USER/Library/Developer/CoreSimulator/Devices/7383ACFE-1671-4BEF-87DA-5834D2725987/data/Containers/Bundle/Application/5E441B0F-3133-4583-B72D-0CEAFA011F28/CatoNative.app/CatoNative
Reason: tried: '/Library/Developer/CoreSimulator/Volumes/iOS_22G86/Library/Developer/CoreSimulator/Profiles/Runtimes/iOS 18.6.simruntime/Contents/Resources/RuntimeRoot/Library/Frameworks/CatoNativeCore.framework/CatoNativeCore' (no such file), '/Library/Frameworks/CatoNativeCore.framework/CatoNativeCore' (no such file), '/Library/Developer/CoreSimulator/Volumes/iOS_22G86/Library/Developer/CoreSimulator/Profiles/Runtimes/iOS 18.6.simruntime/Contents/Resources/RuntimeRoot/System/Library/Frameworks/CatoNativeCore.framework/CatoNativeCore' (no such file)
(terminated at launch; ignore backtrace)

Dyld Error Message:
  1


Thread 0 Crashed:
0   dyld                          	       0x10263d940 __abort_with_payload + 8
1   dyld                          	       0x1026c3e20 abort_with_payload_wrapper_internal + 104
2   dyld                          	       0x1026c3e54 abort_with_payload + 16
3   ???                           	       0x1027abda4 ???
4   ???                           	       0x1027707bc ???
5   ???                           	       0x10276df7c ???
6   ???                           	       0x10276d348 ???
7   dyld                          	       0x102642bec dyld4::prepareSim(dyld4::RuntimeState&, char const*) + 1300
8   dyld                          	       0x1026416a0 dyld4::prepare(dyld4::APIs&, mach_o::Header const*) + 368
9   dyld                          	       0x102640d04 start + 7104


Thread 0 crashed with ARM Thread State (64-bit):
    x0: 0x0000000000000006   x1: 0x0000000000000001   x2: 0x000000016d9ec370   x3: 0x0000000000000112
    x4: 0x000000016d9ebf70   x5: 0x0000000000000000   x6: 0x00000000000000e0   x7: 0x0000000000000000
    x8: 0x0000000000000020   x9: 0x0000000000000012  x10: 0x0000000000000000  x11: 0x207972617262694c
   x12: 0x0000000000000065  x13: 0x0000000000000038  x14: 0x0000000254356a46  x15: 0x0000000000000003
   x16: 0x0000000000000209  x17: 0x000000010263bf60  x18: 0x0000000000000000  x19: 0x0000000000000000
   x20: 0x000000016d9ebf70  x21: 0x0000000000000112  x22: 0x000000016d9ec370  x23: 0x0000000000000001
   x24: 0x0000000000000006  x25: 0x0000000000000000  x26: 0x00000000000b8000  x27: 0x00000000000a4000
   x28: 0x0000000000000000   fp: 0x000000016d9ebf30   lr: 0x00000001026c3e20
    sp: 0x000000016d9ebef0   pc: 0x000000010263d940 cpsr: 0x00000000
   far: 0x0000000000000000  esr: 0x56000080 (Syscall)

Binary Images:
       0x102638000 -        0x1026d7fff dyld (*) <0975afba-c46b-364c-bd84-a75daa9e455a> /usr/lib/dyld
       0x102410000 -        0x10242bfff com.anuragkarki.cato.native (0.1.0) <b9423539-ba6d-3c7d-95e8-18291166229c> /Users/USER/Library/Developer/CoreSimulator/Devices/7383ACFE-1671-4BEF-87DA-5834D2725987/data/Containers/Bundle/Application/5E441B0F-3133-4583-B72D-0CEAFA011F28/CatoNative.app/CatoNative
               0x0 - 0xffffffffffffffff ??? (*) <00000000-0000-0000-0000-000000000000> ???

External Modification Summary:
  Calls made by other processes targeting this process:
    task_for_pid: 0
    thread_create: 0
    thread_set_state: 0
  Calls made by this process:
    task_for_pid: 0
    thread_create: 0
    thread_set_state: 0
  Calls made by all processes on this machine:
    task_for_pid: 0
    thread_create: 0
    thread_set_state: 0

VM Region Summary:
ReadOnly portion of Libraries: Total=1568K resident=0K(0%) swapped_out_or_unallocated=1568K(100%)
Writable regions: Total=8448K written=128K(2%) resident=128K(2%) swapped_out=0K(0%) unallocated=8320K(98%)

                                VIRTUAL   REGION 
REGION TYPE                        SIZE    COUNT (non-coalesced) 
===========                     =======  ======= 
STACK GUARD                       56.0M        1 
Stack                             8176K        1 
VM_ALLOCATE                        160K        3 
__DATA                              32K        2 
__DATA_CONST                        48K        2 
__DATA_DIRTY                        16K        1 
__LINKEDIT                         816K        2 
__TEXT                             752K        2 
__TPRO_CONST                       144K        1 
dyld private memory                2.5G        5 
mapped file                        3.5G       15 
page table in kernel               128K        1 
===========                     =======  ======= 
TOTAL                              6.1G       36 


Error Formulating Crash Report:
dyld_process_snapshot_get_shared_cache failed

-----------
Full Report
-----------

{"app_name":"CatoNative","timestamp":"2026-09-17 11:21:13.00 +0700","app_version":"0.1.0","slice_uuid":"b9423539-ba6d-3c7d-95e8-18291166229c","build_version":"1","platform":7,"bundleID":"com.anuragkarki.cato.native","share_with_app_devs":1,"is_first_party":0,"bug_type":"309","os_version":"macOS 26.2 (25C56)","roots_installed":0,"name":"CatoNative","incident_id":"BF94CF02-0CE9-40CD-A9A2-FF82754AECC6"}
{
  "uptime" : 4100,
  "procRole" : "Foreground",
  "version" : 2,
  "userID" : 501,
  "deployVersion" : 210,
  "modelCode" : "Mac16,11",
  "coalitionID" : 1931,
  "osVersion" : {
    "train" : "macOS 26.2",
    "build" : "25C56",
    "releaseType" : "User"
  },
  "captureTime" : "2026-09-17 11:21:13.4114 +0700",
  "codeSigningMonitor" : 2,
  "incident" : "BF94CF02-0CE9-40CD-A9A2-FF82754AECC6",
  "pid" : 51424,
  "translated" : false,
  "cpuType" : "ARM-64",
  "procLaunch" : "2026-09-17 11:21:13.3448 +0700",
  "procStartAbsTime" : 98796698565,
  "procExitAbsTime" : 98798292234,
  "procName" : "CatoNative",
  "procPath" : "\/Users\/USER\/Library\/Developer\/CoreSimulator\/Devices\/7383ACFE-1671-4BEF-87DA-5834D2725987\/data\/Containers\/Bundle\/Application\/5E441B0F-3133-4583-B72D-0CEAFA011F28\/CatoNative.app\/CatoNative",
  "bundleInfo" : {"CFBundleShortVersionString":"0.1.0","CFBundleVersion":"1","CFBundleIdentifier":"com.anuragkarki.cato.native"},
  "storeInfo" : {"deviceIdentifierForVendor":"98D2BD7B-FC4A-5806-BE37-61DF94774D4C","thirdParty":true},
  "parentProc" : "launchd_sim",
  "parentPid" : 49252,
  "coalitionName" : "com.apple.CoreSimulator.SimDevice.7383ACFE-1671-4BEF-87DA-5834D2725987",
  "crashReporterKey" : "765BA742-505C-0910-9661-3C2B17ABE395",
  "appleIntelligenceStatus" : {"state":"available"},
  "developerMode" : 1,
  "responsiblePid" : 48084,
  "responsibleProc" : "SimulatorTrampoline",
  "codeSigningID" : "com.anuragkarki.cato.native",
  "codeSigningTeamID" : "",
  "codeSigningFlags" : 570425857,
  "codeSigningValidationCategory" : 10,
  "codeSigningTrustLevel" : 4294967295,
  "codeSigningAuxiliaryInfo" : 0,
  "instructionByteStream" : {"beforePC":"eAAAALwAAAAoAQAAcAAAAAABAABoAAAAGAEAADgBAAAwQYDSARAA1A==","atPC":"AwEAVH8jA9X9e7+p\/QMAkRb1\/5e\/AwCR\/XvBqP8PX9bAA1\/WEC2A0g=="},
  "bootSessionUUID" : "E2E1253D-6DCB-40D6-A7CA-E0EEC918BCD2",
  "fatalDyldError" : 1,
  "sip" : "enabled",
  "exception" : {"codes":"0x0000000000000000, 0x0000000000000000","rawCodes":[0,0],"type":"EXC_CRASH","signal":"SIGABRT"},
  "termination" : {"code":1,"flags":518,"namespace":"DYLD","indicator":"Library missing","details":["(terminated at launch; ignore backtrace)"],"reasons":["Library not loaded: \/Library\/Frameworks\/CatoNativeCore.framework\/CatoNativeCore","Referenced from: <B9423539-BA6D-3C7D-95E8-18291166229C> \/Users\/USER\/Library\/Developer\/CoreSimulator\/Devices\/7383ACFE-1671-4BEF-87DA-5834D2725987\/data\/Containers\/Bundle\/Application\/5E441B0F-3133-4583-B72D-0CEAFA011F28\/CatoNative.app\/CatoNative","Reason: tried: '\/Library\/Developer\/CoreSimulator\/Volumes\/iOS_22G86\/Library\/Developer\/CoreSimulator\/Profiles\/Runtimes\/iOS 18.6.simruntime\/Contents\/Resources\/RuntimeRoot\/Library\/Frameworks\/CatoNativeCore.framework\/CatoNativeCore' (no such file), '\/Library\/Frameworks\/CatoNativeCore.framework\/CatoNativeCore' (no such file), '\/Library\/Developer\/CoreSimulator\/Volumes\/iOS_22G86\/Library\/Developer\/CoreSimulator\/Profiles\/Runtimes\/iOS 18.6.simruntime\/Contents\/Resources\/RuntimeRoot\/System\/Library\/Frameworks\/CatoNativeCore.framework\/CatoNativeCore' (no such file)"]},
  "extMods" : {"caller":{"thread_create":0,"thread_set_state":0,"task_for_pid":0},"system":{"thread_create":0,"thread_set_state":0,"task_for_pid":0},"targeted":{"thread_create":0,"thread_set_state":0,"task_for_pid":0},"warnings":0},
  "faultingThread" : 0,
  "threads" : [{"triggered":true,"id":204989,"threadState":{"x":[{"value":6},{"value":1},{"value":6134088560},{"value":274},{"value":6134087536},{"value":0},{"value":224},{"value":0},{"value":32},{"value":18},{"value":0},{"value":2340027244252129612},{"value":101},{"value":56},{"value":10002721350},{"value":3},{"value":521},{"value":4335058784,"symbolLocation":56,"symbol":"fcntl"},{"value":0},{"value":0},{"value":6134087536},{"value":274},{"value":6134088560},{"value":1},{"value":6},{"value":0},{"value":753664},{"value":671744},{"value":0}],"flavor":"ARM_THREAD_STATE64","lr":{"value":4335615520},"cpsr":{"value":0},"fp":{"value":6134087472},"sp":{"value":6134087408},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":4335065408,"matchesCrashFrame":1},"far":{"value":0}},"frames":[{"imageOffset":22848,"symbol":"__abort_with_payload","symbolLocation":8,"imageIndex":0},{"imageOffset":572960,"symbol":"abort_with_payload_wrapper_internal","symbolLocation":104,"imageIndex":0},{"imageOffset":573012,"symbol":"abort_with_payload","symbolLocation":16,"imageIndex":0},{"imageOffset":4336565668,"imageIndex":2},{"imageOffset":4336322492,"imageIndex":2},{"imageOffset":4336312188,"imageIndex":2},{"imageOffset":4336309064,"imageIndex":2},{"imageOffset":44012,"symbol":"dyld4::prepareSim(dyld4::RuntimeState&, char const*)","symbolLocation":1300,"imageIndex":0},{"imageOffset":38560,"symbol":"dyld4::prepare(dyld4::APIs&, mach_o::Header const*)","symbolLocation":368,"imageIndex":0},{"imageOffset":36100,"symbol":"start","symbolLocation":7104,"imageIndex":0}]}],
  "usedImages" : [
  {
    "source" : "P",
    "arch" : "arm64e",
    "base" : 4335042560,
    "size" : 655360,
    "uuid" : "0975afba-c46b-364c-bd84-a75daa9e455a",
    "path" : "\/usr\/lib\/dyld",
    "name" : "dyld"
  },
  {
    "source" : "P",
    "arch" : "arm64",
    "base" : 4332781568,
    "CFBundleShortVersionString" : "0.1.0",
    "CFBundleIdentifier" : "com.anuragkarki.cato.native",
    "size" : 114688,
    "uuid" : "b9423539-ba6d-3c7d-95e8-18291166229c",
    "path" : "\/Users\/USER\/Library\/Developer\/CoreSimulator\/Devices\/7383ACFE-1671-4BEF-87DA-5834D2725987\/data\/Containers\/Bundle\/Application\/5E441B0F-3133-4583-B72D-0CEAFA011F28\/CatoNative.app\/CatoNative",
    "name" : "CatoNative",
    "CFBundleVersion" : "1"
  },
  {
    "size" : 0,
    "source" : "A",
    "base" : 0,
    "uuid" : "00000000-0000-0000-0000-000000000000"
  }
],
  "vmSummary" : "ReadOnly portion of Libraries: Total=1568K resident=0K(0%) swapped_out_or_unallocated=1568K(100%)\nWritable regions: Total=8448K written=128K(2%) resident=128K(2%) swapped_out=0K(0%) unallocated=8320K(98%)\n\n                                VIRTUAL   REGION \nREGION TYPE                        SIZE    COUNT (non-coalesced) \n===========                     =======  ======= \nSTACK GUARD                       56.0M        1 \nStack                             8176K        1 \nVM_ALLOCATE                        160K        3 \n__DATA                              32K        2 \n__DATA_CONST                        48K        2 \n__DATA_DIRTY                        16K        1 \n__LINKEDIT                         816K        2 \n__TEXT                             752K        2 \n__TPRO_CONST                       144K        1 \ndyld private memory                2.5G        5 \nmapped file                        3.5G       15 \npage table in kernel               128K        1 \n===========                     =======  ======= \nTOTAL                              6.1G       36 \n",
  "legacyInfo" : {
  "threadTriggered" : {

  }
},
  "logWritingSignature" : "c1c185314df24f33312cc5c93ae21b5226e30d95",
  "roots_installed" : 0,
  "bug_type" : "309",
  "trmStatus" : 8192,
  "trialInfo" : {
  "rollouts" : [
    {
      "rolloutId" : "6761d0c9df60af01adb250fb",
      "factorPackIds" : [

      ],
      "deploymentId" : 240000009
    },
    {
      "rolloutId" : "64c025b28b7f0e739e4fbe58",
      "factorPackIds" : [

      ],
      "deploymentId" : 240000044
    }
  ],
  "experiments" : [

  ]
},
  "reportNotes" : [
  "dyld_process_snapshot_get_shared_cache failed"
]
}

