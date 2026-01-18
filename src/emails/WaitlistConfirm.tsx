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

export function WaitlistConfirm(props: {
	productName: string;
	ctaUrl: string;
}) {
	const { productName, ctaUrl } = props;

	return (
		<Html>
			<Head />
			<Preview>You're on the {productName} waitlist.</Preview>
			<Body style={styles.body}>
				<Container style={styles.container}>
					<Heading style={styles.h1}>You're in.</Heading>

					<Text style={styles.p}>
						Thanks for joining the {productName} waitlist. I'll email you when
						the first version is ready.
					</Text>

					<Section style={styles.ctaWrap}>
						<Link href={ctaUrl} style={styles.cta}>
							View your waitlist status
						</Link>
					</Section>

					<Hr style={styles.hr} />

					<Text style={styles.small}>
						If you didn't request this, you can ignore this email.
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
