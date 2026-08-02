import AppKit

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let assets = root.appendingPathComponent("apps/mobile/assets", isDirectory: true)
try FileManager.default.createDirectory(at: assets, withIntermediateDirectories: true)

func color(_ hex: UInt32) -> NSColor {
  let red = CGFloat((hex >> 16) & 0xff) / 255.0
  let green = CGFloat((hex >> 8) & 0xff) / 255.0
  let blue = CGFloat(hex & 0xff) / 255.0
  return NSColor(red: red, green: green, blue: blue, alpha: 1)
}

func writePNG(_ image: NSImage, to url: URL) throws {
  guard
    let tiff = image.tiffRepresentation,
    let bitmap = NSBitmapImageRep(data: tiff),
    let png = bitmap.representation(using: .png, properties: [:])
  else {
    throw NSError(domain: "CatoIcon", code: 1)
  }

  try png.write(to: url)
}

func makeIcon(background: NSColor, transparent: Bool = false) -> NSImage {
  let size = NSSize(width: 1024, height: 1024)
  let image = NSImage(size: size)

  image.lockFocus()

  if transparent {
    NSColor.clear.setFill()
  } else {
    background.setFill()
  }
  NSBezierPath(rect: NSRect(origin: .zero, size: size)).fill()

  let markRect = transparent
    ? NSRect(x: 162, y: 162, width: 700, height: 700)
    : NSRect(x: 0, y: 0, width: 1024, height: 1024)
  let radius: CGFloat = transparent ? 150 : 0
  let markPath = NSBezierPath(roundedRect: markRect, xRadius: radius, yRadius: radius)
  color(0x111111).setFill()
  markPath.fill()

  let paragraph = NSMutableParagraphStyle()
  paragraph.alignment = .center

  let font = NSFont.systemFont(ofSize: transparent ? 500 : 620, weight: .black)
  let attributes: [NSAttributedString.Key: Any] = [
    .font: font,
    .foregroundColor: color(0x8bd31f),
    .paragraphStyle: paragraph
  ]
  let text = "C" as NSString
  let textRect = transparent
    ? NSRect(x: 162, y: 206, width: 700, height: 600)
    : NSRect(x: 0, y: 218, width: 1024, height: 680)
  text.draw(in: textRect, withAttributes: attributes)

  image.unlockFocus()
  return image
}

let icon = makeIcon(background: color(0x111111))
let adaptive = makeIcon(background: NSColor.clear, transparent: true)

try writePNG(icon, to: assets.appendingPathComponent("icon.png"))
try writePNG(adaptive, to: assets.appendingPathComponent("adaptive-icon.png"))
try writePNG(icon, to: root.appendingPathComponent("apps/mobile/ios/Cato/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png"))
