import { Link, Section, Text } from "@react-email/components";
import { EMAIL_CONFIG, styles } from "./styles";

export function EmailFooter(props: {
	productName?: string;
	unsubscribeUrl: string;
}) {
	const { productName = EMAIL_CONFIG.productName, unsubscribeUrl } = props;

	return (
		<Section style={styles.footer}>
			<Text style={styles.footerText}>
				<Link href={EMAIL_CONFIG.websiteUrl} style={styles.footerLink}>
					{productName}
				</Link>{" "}
				· {new Date().getFullYear()}
			</Text>
			<Text
				style={{
					...styles.footerText,
					fontSize: 11,
					marginTop: 8,
				}}
			>
				You're receiving this because you joined the waitlist or created an
				account on {productName}.{" "}
				<Link href={unsubscribeUrl} style={styles.footerLink}>
					Unsubscribe
				</Link>
			</Text>
		</Section>
	);
}
