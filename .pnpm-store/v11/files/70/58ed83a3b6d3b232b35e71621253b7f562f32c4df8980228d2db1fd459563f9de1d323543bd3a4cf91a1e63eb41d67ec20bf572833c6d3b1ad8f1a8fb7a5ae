import * as React$1 from "react";

//#region src/utils/as.d.ts
type As<DefaultTag extends React.ElementType, T1 extends React.ElementType, T2 extends React.ElementType = T1, T3 extends React.ElementType = T1, T4 extends React.ElementType = T1, T5 extends React.ElementType = T1> = (React.ComponentPropsWithRef<DefaultTag> & {
  as?: DefaultTag;
}) | (React.ComponentPropsWithRef<T1> & {
  as: T1;
}) | (React.ComponentPropsWithRef<T2> & {
  as: T2;
}) | (React.ComponentPropsWithRef<T3> & {
  as: T3;
}) | (React.ComponentPropsWithRef<T4> & {
  as: T4;
}) | (React.ComponentPropsWithRef<T5> & {
  as: T5;
});
//#endregion
//#region src/utils/spaces.d.ts
interface Margin {
  m?: number | string;
  mx?: number | string;
  my?: number | string;
  mt?: number | string;
  mr?: number | string;
  mb?: number | string;
  ml?: number | string;
}
//#endregion
//#region src/heading.d.ts
type HeadingAs = As<'h1', 'h2', 'h3', 'h4', 'h5', 'h6'>;
type HeadingProps = HeadingAs & Margin;
declare const Heading: React$1.ForwardRefExoticComponent<(Omit<Readonly<React$1.ClassAttributes<HTMLHeadingElement> & React$1.HTMLAttributes<HTMLHeadingElement> & {
  as?: "h1" | undefined;
} & Margin>, "ref"> | Omit<Readonly<React$1.ClassAttributes<HTMLHeadingElement> & React$1.HTMLAttributes<HTMLHeadingElement> & {
  as: "h2";
} & Margin>, "ref"> | Omit<Readonly<React$1.ClassAttributes<HTMLHeadingElement> & React$1.HTMLAttributes<HTMLHeadingElement> & {
  as: "h3";
} & Margin>, "ref"> | Omit<Readonly<React$1.ClassAttributes<HTMLHeadingElement> & React$1.HTMLAttributes<HTMLHeadingElement> & {
  as: "h4";
} & Margin>, "ref"> | Omit<Readonly<React$1.ClassAttributes<HTMLHeadingElement> & React$1.HTMLAttributes<HTMLHeadingElement> & {
  as: "h5";
} & Margin>, "ref"> | Omit<Readonly<React$1.ClassAttributes<HTMLHeadingElement> & React$1.HTMLAttributes<HTMLHeadingElement> & {
  as: "h6";
} & Margin>, "ref">) & React$1.RefAttributes<HTMLHeadingElement>>;
//#endregion
export { Heading, HeadingAs, HeadingProps };
//# sourceMappingURL=index.d.mts.map