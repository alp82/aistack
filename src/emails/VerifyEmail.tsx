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

export function VerifyEmail(props: {
	productName?: string;
	verifyUrl: string;
}) {
	const { productName = EMAIL_CONFIG.productName, verifyUrl } = props;

	return (
		<Html>
			<Head>
				<style>{glowKeyframes}</style>
			</Head>
			<Preview>Verify your {productName} email address</Preview>
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
						<Text style={styles.sectionLabel}>// One Last Step</Text>
						<Heading style={styles.h1}>Verify Your Email</Heading>

						<Text style={styles.p}>
							You're one step away from accessing {productName}. Click below to
							confirm your email address and activate your account.
						</Text>

						<Section style={styles.ctaWrap}>
							<Link href={verifyUrl} style={styles.ctaAnimated}>
								Verify Email  ⟶
							</Link>
						</Section>

						<Text style={styles.small}>
							Didn't sign up? Ignore this email — no action needed.
						</Text>
					</Section>

					<Section style={styles.footer}>
						<Text style={styles.footerText}>
							<Link href="https://aistack.to" style={styles.footerLink}>{productName}</Link> · {new Date().getFullYear()}
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
}
