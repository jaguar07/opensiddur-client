<!-- Isolate sourceDesc and return a JSON-friendly version

    Open Siddur Project
    Copyright 2014-2015 Efraim Feinstein, efraim@opensiddur.org
    Licensed under the GNU Lesser General Public License, version 3 or later
-->
<xsl:stylesheet
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:j="http://jewishliturgy.org/ns/jlptei/1.0"
    xmlns:jf="http://jewishliturgy.org/ns/jlptei/flat/1.0"
    xmlns:html="http://www.w3.org/1999/xhtml"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    version="2.0"
    >

    <xsl:template match="tei:sourceDesc">
        <sources>
            <xsl:apply-templates select="tei:bibl"/>
        </sources>
    </xsl:template>

    <xsl:template match="tei:bibl">
        <bibl>
            <xsl:variable name="source-uri" select="substring-after(tei:ptr[@type='bibl']/@target, '/data/sources/')"/> 
            <!-- warning: the title may end up URI encoded -->
            <title><xsl:value-of select="(tei:title, $source-uri)[1]"/></title>
            <source><xsl:value-of select="$source-uri"/></source>
            <status><xsl:value-of select="@j:docStatus"/></status>
            <scope>
                <fromPage><xsl:value-of select="tei:biblScope/@from"/></fromPage>
                <toPage><xsl:value-of select="tei:biblScope/@to"/></toPage>
            </scope>
            <!-- the format of the bibl-content will be 
                <stream>
                    <streamId>
                    <streamChecked>true|false
                    <id>
                        <checked>
                        <xmlid>
                    </id>
                    ...
                </stream>
                if yes=1, then the stream or id is included in this source
            -->
            <contents>
                <xsl:apply-templates select="//j:streamText|//tei:text/jf:merged|//j:parallelText|//j:annotations">
                    <xsl:with-param name="content-ids" as="xs:string*">
                        <xsl:apply-templates select="tei:ptr[@type='bibl-content']"/>
                    </xsl:with-param>
                </xsl:apply-templates>
            </contents>
        </bibl>
    </xsl:template>

    <xsl:template match="tei:ptr[@type='bibl-content']" as="xs:string*">
        <xsl:variable name="root" select="root(.)"/>
        <xsl:for-each select="tokenize(@target, '\s+')">
            <xsl:choose>
                <xsl:when test="starts-with(., '#range')">
                    <xsl:variable name="left-ptr" select="$root//id(substring-after(substring-before(., ','), '('))"/>
                    <xsl:variable name="right-ptr" select="$root//id(substring-before(substring-after(., ','), ')'))"/>
                    <xsl:for-each select="
                        $left-ptr | 
                        ($left-ptr/following-sibling::* intersect $right-ptr/preceding-sibling::*) | 
                        $right-ptr">
                        <xsl:sequence select="@xml:id/string()"/>
                    </xsl:for-each>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:sequence select="substring-after(., '#')"/>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:for-each>
    </xsl:template>

    <xsl:template match="j:streamText|tei:text/jf:merged|j:parallelText|j:annotations">
        <xsl:param name="content-ids" as="xs:string*"/>

        <xsl:variable name="stream-checked" select="((@id,@jf:id,@xml:id)=$content-ids, false())[1]"/>
        <stream>
            <streamXmlid><xsl:sequence select="(@id,@jf:id,@xml:id)/string()"/></streamXmlid>
            <streamChecked><xsl:sequence select="$stream-checked"/></streamChecked>
            <xsl:for-each select="*[@id|@jf:id|@xml:id]">
                <id>
                    <xmlid><xsl:sequence select="(@id,@jf:id,@xml:id)/string()"/></xmlid>
                    <checked><xsl:sequence select="$stream-checked or (@id,@jf:id,@xml:id)=$content-ids"/></checked>
                </id>
            </xsl:for-each>
        </stream>
    </xsl:template>

    <xsl:template match="/">
        <xsl:apply-templates select="//tei:sourceDesc"/>
    </xsl:template>
    
</xsl:stylesheet>
