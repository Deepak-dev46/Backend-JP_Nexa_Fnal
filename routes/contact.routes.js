
import { Router } from "express";
import { randomBytes } from "node:crypto";
import rateLimit from "express-rate-limit";
import { sendProjectInquiry } from "../services/email.service.js";

const router = Router();

const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        code: "RATE_LIMITED",
        message: "Too many inquiries were submitted. Please try again later.",
    },
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value) {
    return typeof value === "string" ? value.trim() : "";
}

function validateInquiry(body = {}) {
    const data = {
        name: clean(body.name),
        email: clean(body.email),
        company: clean(body.company),
        contact: clean(body.contact), // Optional contact number
        projectType: clean(body.projectType || body.service),
        budget: clean(body.budget),
        message: clean(body.message),
    };


    const errors = {};

    if (data.contact.length > 20) {
        errors.contact = "Contact number must be 20 characters or fewer.";
    }

    if (data.name.length < 2 || data.name.length > 100) {
        errors.name = "Enter a name between 2 and 100 characters.";
    }

    if (data.email.length > 254 || !EMAIL_PATTERN.test(data.email)) {
        errors.email = "Enter a valid email address.";
    }

    if (data.company.length > 120) {
        errors.company = "Company name must be 120 characters or fewer.";
    }

    if (data.projectType.length < 2 || data.projectType.length > 100) {
        errors.projectType = "Select a valid service.";
    }

    if (data.budget.length > 80) {
        errors.budget = "Budget must be 80 characters or fewer.";
    }

    if (data.message.length < 10 || data.message.length > 5000) {
        errors.message = "Message must be between 10 and 5,000 characters.";
    }

    return { data, errors };
}

function createReference() {
    const date = new Date();
    const year = date.getUTCFullYear();
    const random = randomBytes(4).toString("hex").toUpperCase();

    return `JPN-${year}-${random}`;
}

router.get("/", (_req, res) => {
    res.status(200).json({
        success: true,
        service: "JP NEXA Contact API",
        method: "POST",
        path: "/api/contact",
    });
});

router.post("/", contactLimiter, async (req, res) => {
    // Honeypot: bots may fill this hidden field. Return a generic response
    // without sending email if it has a value.
    if (clean(req.body?.website)) {
        return res.status(200).json({
            success: true,
            message: "Your inquiry has been received.",
        });
    }

    const { data, errors } = validateInquiry(req.body);

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            success: false,
            code: "VALIDATION_ERROR",
            message: "Please review the highlighted fields.",
            errors,
        });
    }

    const reference = createReference();

    try {
        const delivery = await sendProjectInquiry({
            ...data,
            reference,
        });

        return res.status(200).json({
            success: true,
            message: "Your inquiry has been received by JP NEXA Technologies.",
            reference,
            confirmationSent: delivery.customerConfirmationSent,
        });
    } catch (error) {
        if (error.message === "INQUIRY_NOTIFICATION_FAILED") {
            return res.status(503).json({
                success: false,
                code: "EMAIL_DELIVERY_FAILED",
                message:
                    "We couldn't complete your inquiry submission. Please try again later or contact us directly.",
                reference,
            });
        }

        console.error("Unexpected contact API error", {
            reference,
            message: error.message,
        });

        return res.status(500).json({
            success: false,
            code: "CONTACT_SUBMISSION_FAILED",
            message: "We couldn't process your inquiry. Please try again later.",
        });
    }
});

export default router;
