export const SITE_LOADER_STORAGE_KEY = "candpluss:intro-loader";
export const SITE_LOADER_QUERY = "loader";

export const SITE_LOADER_BOOTSTRAP = `(function(){try{var q=new URLSearchParams(location.search);var force=q.get("${SITE_LOADER_QUERY}")==="1";if(!force&&sessionStorage.getItem("${SITE_LOADER_STORAGE_KEY}")){document.documentElement.dataset.loader="done";}else{document.documentElement.dataset.loader="pending";}}catch(e){document.documentElement.dataset.loader="pending";}})();`;
