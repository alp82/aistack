import {
	Body,
	Container,
	Head,
	Heading,
	Html,
	Link,
	Preview,
	Row,
	Column,
	Section,
	Text,
} from "@react-email/components";
import { EMAIL_CONFIG, glowKeyframes, styles } from "./styles";

export function MagicLinkEmail(props: {
	productName?: string;
	magicLinkUrl: string;
}) {
	const { productName = EMAIL_CONFIG.productName, magicLinkUrl } = props;

	return (
		<Html>
			<Head>
				<style>{glowKeyframes}</style>
			</Head>
			<Preview>Sign in to {productName}</Preview>
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
						<Text style={styles.sectionLabel}>// Passwordless Access</Text>
						<Heading style={styles.h1}>Sign In Instantly</Heading>

						<Text style={styles.p}>
							No password needed. Click below to access your account. This link
							expires in 10 minutes.
						</Text>

						<Section style={styles.ctaWrap}>
							<Link href={magicLinkUrl} style={styles.ctaAnimated}>
								Sign In ⟶
							</Link>
						</Section>

						<Text style={styles.small}>
							Didn't request this? Ignore this email — your account is safe.
						</Text>
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
