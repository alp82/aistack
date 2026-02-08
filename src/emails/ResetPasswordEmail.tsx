import {
	Body,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Link,
	Preview,
	Section,
	Text,
} from "@react-email/components";
import type * as React from "react";

export function ResetPasswordEmail(props: {
	productName: string;
	resetUrl: string;
}) {
	const { productName, resetUrl } = props;

	return (
		<Html>
			<Head />
			<Preview>Reset your {productName} password</Preview>
			<Body style={styles.body}>
				<Container style={styles.container}>
					<Heading style={styles.h1}>Reset your password</Heading>

					<Text style={styles.p}>
						We received a request to reset your {productName} password. Click
						the button below to choose a new password.
					</Text>

					<Section style={styles.ctaWrap}>
						<Link href={resetUrl} style={styles.cta}>
							Reset Password
						</Link>
					</Section>

					<Text style={styles.p}>
						This link will expire in 1 hour. If you didn't request a password
						reset, you can safely ignore this email.
					</Text>

					<Hr style={styles.hr} />

					<Text style={styles.small}>
						If you're having trouble clicking the button, copy and paste this
						URL into your browser: {resetUrl}
					</Text>
				</Container>
			</Body>
		</Html>
	);
}

const styles: Record<string, React.CSSProperties> = {
	body: {
		backgroundColor: "#f6f7fb",
		fontFamily:
			'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
		padding: "24px 0",
	},
	container: {
		backgroundColor: "#ffffff",
		borderRadius: 12,
		padding: 24,
		margin: "0 auto",
		width: "100%",
		maxWidth: 520,
		border: "1px solid #eceef5",
	},
	h1: { fontSize: 28, margin: "0 0 12px" },
	p: { fontSize: 16, lineHeight: "24px", margin: "0 0 16px" },
	ctaWrap: { marginTop: 8, marginBottom: 8 },
	cta: {
		display: "inline-block",
		padding: "12px 16px",
		borderRadius: 10,
		backgroundColor: "#111827",
		color: "#ffffff",
		textDecoration: "none",
		fontSize: 14,
		fontWeight: 600,
	},
	hr: { borderColor: "#eceef5", margin: "20px 0" },
	small: { fontSize: 12, color: "#6b7280", lineHeight: "18px", margin: 0 },
};
