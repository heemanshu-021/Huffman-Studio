package com.huffmanstudio.service;

import com.huffmanstudio.dto.HealthResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Service providing application operational and health status information.
 */
@Service
public class HealthService {

    private final String applicationVersion;

    public HealthService(@Value("${app.version:1.0.0}") String applicationVersion) {
        this.applicationVersion = applicationVersion;
    }

    /**
     * Inspects operational readiness and constructs a health response.
     *
     * @return current application health status DTO
     */
    public HealthResponse checkHealth() {
        return HealthResponse.up(applicationVersion);
    }
}
