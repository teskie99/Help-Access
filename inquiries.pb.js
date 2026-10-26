/// <reference path="../pb_data/types.d.ts" />
// Help Access enquiries: emails a notice for every new enquiry saved in the "inquiries" table.
// The notice goes to the sender address in Settings > Mail settings, unless the INQUIRY_TO environment variable is set
// (one address, or several separated by commas: a@x.com,b@y.com).
onRecordAfterCreateSuccess(function (e) {
  e.next();
  try {
    var r = e.record;
    var esc = function (v) {
      return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    };
    var line = function (v) { return String(v == null ? "" : v).replace(/[\r\n]+/g, " ").trim(); };
    var meta = e.app.settings().meta;
    var to = [];
    line($os.getenv("INQUIRY_TO")).split(/[,;\s]+/).forEach(function (a) { if (a) to.push({ address: a }); });
    if (!to.length) to.push({ address: meta.senderAddress });
    var rows = [["Name", "name"], ["Company and country", "company"], ["Email", "email"], ["Website", "website"],
                ["I am a", "type"], ["Details", "details"], ["Sent from page", "page"]];
    var html = "<h2 style='font-family:Arial,sans-serif'>New Help Access enquiry</h2>" +
               "<table cellpadding='6' style='border-collapse:collapse;font-family:Arial,sans-serif'>";
    var text = "New Help Access enquiry\n\n";
    for (var i = 0; i < rows.length; i++) {
      var v = r.getString(rows[i][1]);
      if (!v) continue;
      html += "<tr><td style='color:#555;vertical-align:top'><b>" + esc(rows[i][0]) + "</b></td><td>" + esc(v) + "</td></tr>";
      text += rows[i][0] + ": " + v + "\n";
    }
    html += "</table><p style='font-family:Arial,sans-serif'><b>Message</b></p>" +
            "<p style='white-space:pre-wrap;font-family:Arial,sans-serif'>" + esc(r.getString("message")) + "</p>" +
            "<p style='color:#888;font-family:Arial,sans-serif'>Reply to this email to answer the sender directly.</p>";
    text += "\nMessage:\n" + r.getString("message") + "\n";

    var headers = {};
    var from = line(r.getString("email"));
    if (/^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]+$/.test(from)) headers["Reply-To"] = from;

    var subject = "New enquiry: " + line(r.getString("name")).slice(0, 80);
    var company = line(r.getString("company")).slice(0, 80);
    if (company) subject += " (" + company + ")";

    e.app.newMailClient().send(new MailerMessage({
      from: { address: meta.senderAddress, name: "Help Access website" },
      to: to,
      subject: subject,
      html: html,
      text: text,
      headers: headers
    }));
  } catch (err) {
    e.app.logger().error("Enquiry email failed", "error", String(err));
  }
}, "inquiries");
