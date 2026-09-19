// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "NativeSwiftResume",
    platforms: [
        .iOS(.v15),
        .macOS(.v12)
    ],
    products: [
        .library(name: "CatoNativeCore", targets: ["CatoNativeCore"]),
        .library(name: "ResumeParser", targets: ["ResumeParser"]),
        .executable(name: "resume-parser-cli", targets: ["ResumeParserCLI"])
    ],
    targets: [
        .target(name: "CatoNativeCore"),
        .target(name: "ResumeParser"),
        .executableTarget(name: "ResumeParserCLI", dependencies: ["ResumeParser"]),
        .testTarget(name: "CatoNativeCoreTests", dependencies: ["CatoNativeCore"]),
        .testTarget(name: "ResumeParserTests", dependencies: ["ResumeParser"])
    ]
)
