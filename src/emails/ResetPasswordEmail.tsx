import {
	Body,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Link,
	Preview,
	Row,
	Column,
	Section,
	Text,
} from "@react-email/components";
import { EMAIL_CONFIG, glowKeyframes, styles } from "./styles";

export function ResetPasswordEmail(props: {
	productName?: string;
	resetUrl: string;
}) {
	const { productName = EMAIL_CONFIG.productName, resetUrl } = props;

	return (
		<Html>
			<Head>
				<style>{glowKeyframes}</style>
			</Head>
			<Preview>Reset your {productName} password</Preview>
			<Body style={styles.body}>
				<Container style={styles.container}>
					<Section style={styles.header}>
						<Row>
							<Column style={{ width: 16, verticalAlign: "middle" }}>
								<div style={styles.logoSquare} />
							</Column>
							<Column style={{ paddingLeft: 12, verticalAlign: "middle" }}>
								<Text style={styles.logoText}>AI STACK</Text>
							</Column>
						</Row>
					</Section>

					<Section style={styles.content}>
						<Text style={styles.sectionLabel}>// Security</Text>
						<Heading style={styles.h1}>Reset Your Password</Heading>

						<Text style={styles.p}>
							We received a request to reset your {productName} password. Click
							below to choose a new one. This link expires in 1 hour.
						</Text>

						<Section style={styles.ctaWrap}>
							<Link href={resetUrl} style={styles.ctaAnimated}>
								Reset Password ⟶
							</Link>
						</Section>

						<Text style={styles.small}>
							Didn't request this? Ignore this email. Your password stays the
							same.
						</Text>

						<Hr style={styles.hr} />

						<Text style={styles.small}>Button not working? Copy this URL:</Text>
						<Text style={styles.codeBlock}>{resetUrl}</Text>
					</Section>

					<Section style={styles.footer}>
						<Text style={styles.footerText}>
							<Link href="https://aistack.to" style={styles.footerLink}>
								{productName}
							</Link>{" "}
							· {new Date().getFullYear()}
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
}
