
const BRAND = {
  navy: "#0B1020",
  blue: "#2563EB",
  cyan: "#06B6D4",
  white: "#F8FAFC",
  muted: "#64748B",
};
 
function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function shell(content) {
  return `<!doctype html>
  <html lang="en">
    <body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:${BRAND.navy}">
      <div style="max-width:640px;margin:24px auto;padding:0 12px">
        <div style="background:${BRAND.navy};padding:26px 28px;border-radius:14px 14px 0 0">
          <div style="font-size:22px;font-weight:700;letter-spacing:.5px;color:${BRAND.white}">
            JP NEXA <span style="color:${BRAND.cyan}">TECHNOLOGIES</span>
          </div>
          <div style="margin-top:8px;color:#cbd5e1;font-size:13px">
            Technology for What’s Next.
          </div>
        </div>
        <div style="background:#ffffff;padding:28px;border:1px solid #e2e8f0">
          ${content}
        </div>
        <div style="padding:18px;text-align:center;color:${BRAND.muted};font-size:12px;line-height:1.7">
          JP NEXA Technologies<br/>
          Software · AI · Cloud · Automation · Digital Products
        </div>
      </div>
    </body>
  </html>`;
}

function field(label, value) {
  return `<tr>
    <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:${BRAND.muted};font-size:13px;vertical-align:top">
      ${escapeHtml(label)}
    </td>
    <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;vertical-align:top;overflow-wrap:anywhere">
      ${escapeHtml(value || "Not provided")}
    </td>
  </tr>`;
}

export function inquiryNotification(data) {
  const { reference, name, email, company, projectType, budget, message } = data;

  return {
    subject: `New Project Inquiry | ${reference}`,
    text: [
      "New JP NEXA project inquiry",
      `Reference: ${reference}`,
      `Name: ${name}`,
      `Email: ${email}`,
      `Company: ${company || "Not provided"}`,
      `Service: ${projectType}`,
      `Budget: ${budget || "Not specified"}`,
      `Contact: ${data.contact || "Not provided"}`,
      "",
      "Message:",
      message,
    ].join("\n"),
    html: shell(`
      <div style="font-size:12px;letter-spacing:1px;color:${BRAND.blue};font-weight:bold">
        NEW BUSINESS INQUIRY
      </div>
      <h1 style="font-size:25px;margin:10px 0 8px">Project inquiry received</h1>
      <p style="font-size:14px;line-height:1.7;color:#475569">
        A new potential client has submitted the contact form.
      </p>
      <div style="background:#eff6ff;border-left:4px solid ${BRAND.blue};padding:14px;margin:20px 0">
        <div style="font-size:11px;color:${BRAND.muted}">INQUIRY REFERENCE</div>
        <div style="font-size:19px;font-weight:bold;margin-top:5px">${escapeHtml(reference)}</div>
      </div>
      <table style="width:100%;border-collapse:collapse">
        ${field("Name", name)}
        ${field("Email", email)}
        ${field("Company", company)}
        ${field("Contact", data.contact || "Not provided")}
        ${field("Service", projectType)}
        ${field("Budget", budget || "Not specified")}
      </table>
      <h3 style="margin:24px 0 8px">Project message</h3>
      <div style="background:#f8fafc;padding:16px;border-radius:8px;font-size:14px;line-height:1.7;white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(message)}</div>
    `),
  };
}

export function inquiryAcknowledgment(data) {
  const name = escapeHtml(data.name);
  const reference = escapeHtml(data.reference);

  return {
    subject: `We’ve received your inquiry | ${data.reference}`,
    text: `Dear ${data.name},

Thank you for contacting JP NEXA Technologies.

Your project inquiry has been received. Our team will review the information you provided and follow up if further details are needed.

Inquiry reference: ${data.reference}

Please retain this reference for future correspondence. This is an acknowledgment of receipt, not a confirmed project acceptance or delivery commitment.

Regards,
Client Relations Team
JP NEXA Technologies
Technology for What's Next.`,
    html: shell(`
      <div style="font-size:12px;letter-spacing:1px;color:${BRAND.blue};font-weight:bold">
        INQUIRY ACKNOWLEDGMENT
      </div>
      <h1 style="font-size:25px;margin:12px 0">Thank you, ${name}.</h1>
      <p style="font-size:15px;line-height:1.8;color:#475569">
        Thank you for considering JP NEXA Technologies for your project.
        We have received your inquiry and our team will review the information you provided.
      </p>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:18px;margin:24px 0">
        <div style="font-size:11px;color:${BRAND.muted};letter-spacing:.8px">YOUR INQUIRY REFERENCE</div>
        <div style="font-size:21px;font-weight:bold;color:${BRAND.blue};margin:8px 0">${reference}</div>
        <div style="font-size:12px;color:#475569">Keep this reference for future correspondence.</div>
      </div>
      <p style="font-size:14px;line-height:1.8;color:#475569">
        If we need any additional details, our team will contact you using the email address you provided.
      </p>
      <p style="font-size:14px;line-height:1.8">
        Regards,<br/><strong>Client Relations Team</strong><br/>
        JP NEXA Technologies
      </p>
      <div style="margin-top:22px;padding-top:18px;border-top:1px solid #e2e8f0;color:${BRAND.blue};font-weight:bold">
        Technology for What’s Next.
      </div>
    `),
  };
}
