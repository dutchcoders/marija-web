/**
 * Needed so that typescript doesn't complain about importing .scss files.
 */
declare module '*.scss' {
    interface IClassNames {
        [className: string]: string
    }
    const classNames: IClassNames;
    export = classNames;
}