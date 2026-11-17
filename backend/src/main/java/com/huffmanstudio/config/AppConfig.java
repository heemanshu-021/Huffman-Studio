package com.huffmanstudio.config;

import com.huffmanstudio.archive.HuffmanArchiveService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * General application configuration and bean definitions.
 */
@Configuration
public class AppConfig {

    /**
     * Exposes the {@link HuffmanArchiveService} as a Spring bean.
     *
     * @return a singleton instance of HuffmanArchiveService
     */
    @Bean
    public HuffmanArchiveService huffmanArchiveService() {
        return new HuffmanArchiveService();
    }
}
