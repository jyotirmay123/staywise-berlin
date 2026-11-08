// swift-tools-version: 5.10

import PackageDescription

let package = Package(
    name: "PDFManager",
    platforms: [.macOS(.v14)],
    products: [
        .library(name: "PDFManagerCore", targets: ["PDFManagerCore"]),
        .executable(name: "PDFManager", targets: ["PDFManagerApp"]),
        .executable(name: "PDFManagerE2ETests", targets: ["PDFManagerE2ETests"]),
    ],
    targets: [
        .target(name: "PDFManagerCore"),
        .executableTarget(
            name: "PDFManagerApp",
            dependencies: ["PDFManagerCore"]
        ),
        .executableTarget(
            name: "PDFManagerE2ETests",
            dependencies: ["PDFManagerCore"]
        ),
    ]
)
