package com.composum.sling.nodes.servlet;

import com.composum.sling.core.BeanContext;
import com.composum.sling.core.util.ResourceUtil;
import com.composum.sling.nodes.NodesConfiguration;
import org.apache.commons.lang3.StringUtils;
import org.apache.felix.scr.annotations.Activate;
import org.apache.felix.scr.annotations.Reference;
import org.apache.felix.scr.annotations.sling.SlingServlet;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.request.RequestPathInfo;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.servlets.SlingSafeMethodsServlet;
import org.osgi.framework.BundleContext;

import javax.jcr.RepositoryException;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@SlingServlet(
        methods = {"GET"},
        paths = "/bin/cpm/nodes/source",
        extensions = {"xml", "zip", "pkg"}
)
public class SourceServlet extends SlingSafeMethodsServlet {

    @Reference
    protected NodesConfiguration nodesConfig;

    protected BundleContext bundleContext;

    @Activate
    private void activate(final BundleContext bundleContext) {
        this.bundleContext = bundleContext;
    }

    protected boolean isEnabled() {
        return nodesConfig.isEnabled(this);
    }

    @Override
    protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response)
            throws ServletException, IOException {

        if (!isEnabled()) {
            response.sendError(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
            return;
        }

        Resource resource = null;
        RequestPathInfo pathInfo = request.getRequestPathInfo();
        String resourcePath = pathInfo.getSuffix();
        if (StringUtils.isNotBlank(resourcePath)) {
            ResourceResolver resolver = request.getResourceResolver();
            resource = resolver.getResource(resourcePath);
        }

        if (resource != null && !ResourceUtil.isNonExistingResource(resource)) {

            try {
                SourceModel sourceModel = new SourceModel(nodesConfig,
                        new BeanContext.Servlet(getServletContext(), bundleContext, request, response),
                        resource);

                String name = resource.getName();
                String ext = pathInfo.getExtension();

                if ("xml".equalsIgnoreCase(ext)) {
                    // a single page or a node in its XML source representation

                    response.setCharacterEncoding("UTF-8");
                    //response.setContentType("text/xml;charset=UTF-8");
                    response.setContentType("text/plain;charset=UTF-8"); // best to avoid any conversion by the client
                    //response.setContentType("application/octet-stream");
                    response.setHeader("Content-Disposition", "inline; filename=.content.xml");

                    sourceModel.writeFile(response.getWriter(), false);

                } else if ("zip".equalsIgnoreCase(ext)) {
                    // a content hierarchy in a zipped structure with '.content.xml' for the content within

                    if (!name.endsWith(".zip")) {
                        name += ".zip";
                    }

                    response.setContentType("application/octet-stream");
                    response.setHeader("Content-Disposition", "inline; filename=" + name);

                    sourceModel.writeArchive(response.getOutputStream());

                } else if ("pkg".equalsIgnoreCase(ext)) {
                    // a content hierarchy in a zipped Vault package for installation by the Package Manager

                    String group = "source";
                    if (name.endsWith(".zip")) {
                        name = name.substring(0, name.length() - 4);
                    }
                    name += "-source-package";
                    String version = "current";

                    response.setContentType("application/octet-stream");
                    response.setHeader("Content-Disposition", "inline; filename=" + name + "-" + version + ".zip");

                    sourceModel.writePackage(response.getOutputStream(), group, name, version);

                } else {
                    response.sendError(HttpServletResponse.SC_BAD_REQUEST);
                }

            } catch (RepositoryException ex) {
                throw new ServletException(ex);
            }

        } else {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
        }
    }
}
