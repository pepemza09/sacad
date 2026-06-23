import { Link } from "react-router";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  pageTitle?: string;
  items?: BreadcrumbItem[];
}

const PageBreadcrumb: React.FC<BreadcrumbProps> = ({ pageTitle, items }) => {
  if (pageTitle) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {pageTitle}
        </h2>
        <nav>
          <ol className="flex items-center gap-1.5">
            <li>
              <Link
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"
                to="/"
              >
                Home
                <svg
                  className="stroke-current"
                  width="17"
                  height="16"
                  viewBox="0 0 17 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                    stroke=""
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </li>
            <li className="text-sm text-gray-800 dark:text-white/90">
              {pageTitle}
            </li>
          </ol>
        </nav>
      </div>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <nav className="mb-6 text-sm whitespace-nowrap">
      <Link
        className="text-gray-500 dark:text-gray-400 hover:text-brand-500"
        to="/"
      >
        Home
      </Link>
      {items.map((item, index) => (
        <span key={index}>
          <span className="mx-1.5 text-gray-300 dark:text-gray-600">·</span>
          {item.href ? (
            <Link
              className="text-gray-500 dark:text-gray-400 hover:text-brand-500"
              to={item.href}
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-800 dark:text-white/90">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
};

export default PageBreadcrumb;
