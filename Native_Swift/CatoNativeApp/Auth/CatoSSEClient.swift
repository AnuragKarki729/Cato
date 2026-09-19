import Foundation
import CatoNativeCore

struct CatoSSEEvent {
    let name: String
    let data: String
}

final class CatoSSEClient: NSObject, ObservableObject {
    private let baseURL: URL
    private let accessToken: String
    private let role: CatoRole
    private var task: URLSessionDataTask?
    private var session: URLSession?
    private var currentEventName: String?
    private var currentDataLines: [String] = []
    private var buffer = ""

    init(config: CatoConfig, accessToken: String, role: CatoRole) {
        self.baseURL = config.apiBaseURL
        self.accessToken = accessToken
        self.role = role
    }

    func start() {
        stop()

        let path = role == .recruiter ? "/recruiter/events" : "/applicant/events"
        guard let url = URL(string: path, relativeTo: baseURL) else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("text/event-stream", forHTTPHeaderField: "Accept")
        request.cachePolicy = .reloadIgnoringLocalCacheData
        request.timeoutInterval = .infinity

        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = .infinity
        configuration.timeoutIntervalForResource = .infinity
        let session = URLSession(configuration: configuration, delegate: self, delegateQueue: nil)
        self.session = session
        task = session.dataTask(with: request)
        task?.resume()
    }

    func stop() {
        task?.cancel()
        task = nil
        session?.invalidateAndCancel()
        session = nil
        currentEventName = nil
        currentDataLines = []
        buffer = ""
    }

    private func receive(_ data: Data) {
        guard let chunk = String(data: data, encoding: .utf8) else { return }
        buffer.append(chunk)

        while let newlineRange = buffer.range(of: "\n") {
            let line = String(buffer[..<newlineRange.lowerBound]).trimmingCharacters(in: CharacterSet(charactersIn: "\r"))
            buffer.removeSubrange(buffer.startIndex...newlineRange.lowerBound)
            processLine(line)
        }
    }

    private func processLine(_ line: String) {
        if line.isEmpty {
            flushEvent()
            return
        }

        if line.hasPrefix(":") {
            return
        }

        if line.hasPrefix("event:") {
            currentEventName = String(line.dropFirst("event:".count)).trimmingCharacters(in: .whitespaces)
            return
        }

        if line.hasPrefix("data:") {
            currentDataLines.append(String(line.dropFirst("data:".count)).trimmingCharacters(in: .whitespaces))
        }
    }

    private func flushEvent() {
        guard let eventName = currentEventName, !currentDataLines.isEmpty else {
            currentEventName = nil
            currentDataLines = []
            return
        }

        let event = CatoSSEEvent(name: eventName, data: currentDataLines.joined(separator: "\n"))

        DispatchQueue.main.async {
            switch eventName {
            case "message_sent":
                NotificationCenter.default.post(name: .catoMessageEventReceived, object: event)
            case "interest_request_sent", "interest_request_responded":
                NotificationCenter.default.post(name: .catoInterestRequestEventReceived, object: event)
            default:
                NotificationCenter.default.post(name: .catoSSEEventReceived, object: event)
            }
        }

        currentEventName = nil
        currentDataLines = []
    }
}

extension CatoSSEClient: URLSessionDataDelegate {
    func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
        receive(data)
    }
}

extension Notification.Name {
    static let catoSSEEventReceived = Notification.Name("catoSSEEventReceived")
    static let catoMessageEventReceived = Notification.Name("catoMessageEventReceived")
    static let catoInterestRequestEventReceived = Notification.Name("catoInterestRequestEventReceived")
    static let catoMessageReadStateDidChange = Notification.Name("catoMessageReadStateDidChange")
}
