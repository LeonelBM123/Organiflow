package com.sw.organiflow.modules.collaboration.dto;

import java.util.List;

public record PresencePayload(
        List<ActiveUserDto> activeUsers
) {}
