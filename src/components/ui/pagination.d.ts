import * as React from "react";

export const Pagination: React.FC<React.ComponentProps<"nav">>;
export const PaginationContent: React.FC<React.ComponentProps<"ul">>;
export const PaginationItem: React.FC<React.ComponentProps<"li">>;
export const PaginationLink: React.FC<React.HTMLProps<HTMLAnchorElement> & { isActive?: boolean, size?: string }>;
export const PaginationNext: React.FC<React.ComponentProps<"a">>;
export const PaginationPrevious: React.FC<React.ComponentProps<"a">>;
export const PaginationEllipsis: React.FC<React.ComponentProps<"span">>; 